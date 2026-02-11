import { describe, it, expect } from "vitest";
import { ReactGenerator } from "./react.js";

describe("ReactGenerator", () => {
  const generator = new ReactGenerator();

  describe("basic properties", () => {
    it("has correct framework identifier", () => {
      expect(generator.framework).toBe("react");
    });

    it("has correct file extension", () => {
      expect(generator.extension).toBe(".tsx");
    });
  });

  describe("generate", () => {
    describe("with props enabled (default)", () => {
      it("generates a React component with props interface", () => {
        // Use a more complex path that won't be optimized away
        const result = generator.generate({
          componentName: "ArrowIcon",
          svgContent: '<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
        });

        expect(result.code).toContain("import type { SVGProps } from");
        expect(result.code).toContain("interface ArrowIconProps");
        expect(result.code).toContain("export function ArrowIcon");
        expect(result.code).toContain("size = 24");
        expect(result.code).toContain('color = "currentColor"');
        expect(result.code).toContain("{...props}");
      });

      it("transforms kebab-case attributes to camelCase", () => {
        // stroke-width requires stroke to not be optimized away by SVGO
        const result = generator.generate({
          componentName: "TestIcon",
          svgContent:
            '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="red" stroke-width="2" fill-rule="evenodd"/></svg>',
        });

        expect(result.code).toContain("strokeWidth");
        expect(result.code).toContain("fillRule");
        expect(result.code).not.toContain("stroke-width=");
        expect(result.code).not.toContain("fill-rule=");
      });

      it("replaces width and height with size prop", () => {
        const result = generator.generate({
          componentName: "SizedIcon",
          svgContent:
            '<svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/></svg>',
        });

        expect(result.code).toContain("width={size}");
        expect(result.code).toContain("height={size}");
        // Should not have hardcoded width/height values
        expect(result.code).not.toMatch(/width="48"/);
        expect(result.code).not.toMatch(/height="48"/);
      });

      it("uses color prop for fill attribute", () => {
        // Use a non-default fill color that SVGO won't optimize away
        const result = generator.generate({
          componentName: "ColorIcon",
          svgContent:
            '<svg viewBox="0 0 24 24" fill="red"><circle cx="12" cy="12" r="10"/></svg>',
        });

        expect(result.code).toContain("fill={color}");
        // The original fill="red" should be replaced
        expect(result.code).not.toContain('fill="red"');
      });

      it("preserves fill=none on root svg", () => {
        const result = generator.generate({
          componentName: "OutlineIcon",
          svgContent:
            '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor"/></svg>',
        });

        // fill="none" should be preserved, not replaced with color prop
        expect(result.code).not.toContain("fill={color}");
      });

      it("converts class to className", () => {
        const result = generator.generate({
          componentName: "ClassIcon",
          svgContent:
            '<svg viewBox="0 0 24 24"><g class="icon-group"><circle cx="12" cy="12" r="10"/></g></svg>',
        });

        expect(result.code).toContain("className");
        expect(result.code).not.toContain('class="icon-group"');
      });
    });

    describe("with props disabled", () => {
      it("generates a simple component without props", () => {
        const result = generator.generate({
          componentName: "SimpleIcon",
          svgContent: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
          props: false,
        });

        expect(result.code).toContain("export function SimpleIcon()");
        expect(result.code).not.toContain("import type { SVGProps }");
        expect(result.code).not.toContain("interface");
        expect(result.code).not.toContain("{...props}");
      });

      it("still transforms attributes to camelCase", () => {
        // stroke-* attributes require stroke to not be optimized away
        const result = generator.generate({
          componentName: "NoPropsIcon",
          svgContent:
            '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="red" stroke-width="2" stroke-linecap="round"/></svg>',
          props: false,
        });

        expect(result.code).toContain("strokeWidth");
        expect(result.code).toContain("strokeLinecap");
      });
    });

    describe("complex SVG handling", () => {
      it("handles nested elements", () => {
        // Use groups with fill/stroke attributes that won't be collapsed by SVGO
        const result = generator.generate({
          componentName: "NestedIcon",
          svgContent: `
            <svg viewBox="0 0 24 24">
              <g fill="red">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="6" cy="6" r="3"/>
              </g>
            </svg>
          `,
        });

        expect(result.code).toContain("<g");
        expect(result.code).toContain("</g>");
        expect(result.code).toContain("<circle");
      });

      it("handles multiple children", () => {
        const result = generator.generate({
          componentName: "MultiIcon",
          svgContent: `
            <svg viewBox="0 0 24 24">
              <path d="M5 12h14"/>
              <circle cx="10" cy="10" r="5"/>
            </svg>
          `,
        });

        expect(result.code).toContain("<path");
        expect(result.code).toContain("<circle");
      });

      it("handles text elements", () => {
        const result = generator.generate({
          componentName: "TextIcon",
          svgContent: '<svg viewBox="0 0 100 100"><text x="10" y="20">Hello</text></svg>',
        });

        expect(result.code).toContain("<text");
        expect(result.code).toContain("Hello");
        expect(result.code).toContain("</text>");
      });

      it("handles style attributes", () => {
        const result = generator.generate({
          componentName: "StyledIcon",
          svgContent:
            '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" style="fill: red; stroke-width: 2"/></svg>',
        });

        // Style should be converted to object format
        expect(result.code).toContain("style={");
      });
    });

    describe("SVG optimization", () => {
      it("removes xmlns attribute", () => {
        const result = generator.generate({
          componentName: "OptimizedIcon",
          svgContent:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        });

        // SVGO should remove xmlns for React components
        expect(result.code).not.toContain('xmlns="http://www.w3.org/2000/svg"');
      });

      it("removes comments from SVG", () => {
        const result = generator.generate({
          componentName: "CleanIcon",
          svgContent: `
            <svg viewBox="0 0 24 24">
              <!-- This is a comment -->
              <circle cx="12" cy="12" r="10"/>
            </svg>
          `,
        });

        expect(result.code).not.toContain("<!-- This is a comment -->");
      });
    });

    describe("return value", () => {
      it("returns correct metadata", () => {
        const result = generator.generate({
          componentName: "MetaIcon",
          svgContent: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        });

        expect(result.framework).toBe("react");
        expect(result.extension).toBe(".tsx");
        expect(typeof result.code).toBe("string");
      });
    });
  });
});

describe("ReactGenerator attribute transformation", () => {
  const generator = new ReactGenerator();

  // Test cases that SVGO won't optimize away
  // stroke-* attributes need stroke to be set
  // fill-* attributes need fill to be set
  const attributeTestCases = [
    {
      input: "stroke-width",
      expected: "strokeWidth",
      svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="red" stroke-width="2"/></svg>',
    },
    {
      input: "fill-opacity",
      expected: "fillOpacity",
      svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14" fill="red" fill-opacity="0.5"/></svg>',
    },
    {
      input: "stroke-linecap",
      expected: "strokeLinecap",
      svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="red" stroke-linecap="round"/></svg>',
    },
    {
      input: "stroke-linejoin",
      expected: "strokeLinejoin",
      svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="red" stroke-linejoin="round"/></svg>',
    },
    {
      input: "clip-rule",
      expected: "clipRule",
      svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14" clip-rule="evenodd"/></svg>',
    },
  ];

  for (const { input, expected, svg } of attributeTestCases) {
    it(`transforms ${input} to ${expected}`, () => {
      const result = generator.generate({
        componentName: "TestIcon",
        svgContent: svg,
      });

      expect(result.code).toContain(expected);
      expect(result.code).not.toContain(`${input}="`);
    });
  }
});
