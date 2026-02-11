import { describe, it, expect } from "vitest";
import {
  parseSvg,
  isValidSvg,
  extractRootSvg,
  serializeSvgElement,
} from "./parser.js";
import type { SvgElement } from "./types.js";

describe("isValidSvg", () => {
  it("returns true for valid SVG with content", () => {
    expect(isValidSvg('<svg viewBox="0 0 24 24"><path d="M12 2"/></svg>')).toBe(
      true
    );
  });

  it("returns true for empty SVG element", () => {
    expect(isValidSvg("<svg></svg>")).toBe(true);
  });

  it("returns true for self-closing SVG element", () => {
    // Self-closing SVG is valid (used by SVGO for optimized output)
    expect(isValidSvg("<svg/>")).toBe(true);
  });

  it("returns true for SVG with attributes", () => {
    expect(
      isValidSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24"></svg>')
    ).toBe(true);
  });

  it("returns true for multiline SVG", () => {
    const svg = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2"/>
      </svg>
    `;
    expect(isValidSvg(svg)).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isValidSvg("not svg content")).toBe(false);
  });

  it("returns false for HTML without SVG", () => {
    expect(isValidSvg("<div><span>hello</span></div>")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidSvg("")).toBe(false);
  });

  it("returns false for incomplete SVG tag", () => {
    expect(isValidSvg("<svg><path")).toBe(false);
  });
});

describe("parseSvg", () => {
  describe("basic parsing", () => {
    it("parses a simple SVG with path", () => {
      const svg = '<svg viewBox="0 0 24 24"><path d="M12 2L2 7"/></svg>';
      const result = parseSvg(svg);

      expect(result.root.name).toBe("svg");
      expect(result.root.type).toBe("element");
      expect(result.viewBox).toBe("0 0 24 24");
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].name).toBe("path");
    });

    it("parses SVG with multiple children", () => {
      const svg =
        '<svg><path d="M1 1"/><circle cx="10" cy="10" r="5"/><rect x="0" y="0"/></svg>';
      const result = parseSvg(svg);

      expect(result.root.children).toHaveLength(3);
      expect(result.root.children[0].name).toBe("path");
      expect(result.root.children[1].name).toBe("circle");
      expect(result.root.children[2].name).toBe("rect");
    });

    it("parses nested elements", () => {
      const svg = '<svg><g id="group"><path d="M1 1"/><path d="M2 2"/></g></svg>';
      const result = parseSvg(svg);

      expect(result.root.children).toHaveLength(1);
      const group = result.root.children[0];
      expect(group.name).toBe("g");
      expect(group.attributes.id).toBe("group");
      expect(group.children).toHaveLength(2);
    });

    it("parses deeply nested elements", () => {
      const svg = "<svg><g><g><g><path/></g></g></g></svg>";
      const result = parseSvg(svg);

      let current = result.root;
      for (let i = 0; i < 3; i++) {
        expect(current.children).toHaveLength(1);
        expect(current.children[0].name).toBe("g");
        current = current.children[0];
      }
      expect(current.children[0].name).toBe("path");
    });
  });

  describe("attribute extraction", () => {
    it("extracts viewBox attribute", () => {
      const svg = '<svg viewBox="0 0 100 100"></svg>';
      const result = parseSvg(svg);

      expect(result.viewBox).toBe("0 0 100 100");
    });

    it("extracts width and height", () => {
      const svg = '<svg width="48" height="48"></svg>';
      const result = parseSvg(svg);

      expect(result.width).toBe("48");
      expect(result.height).toBe("48");
    });

    it("extracts all common attributes", () => {
      const svg =
        '<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"></svg>';
      const result = parseSvg(svg);

      expect(result.viewBox).toBe("0 0 24 24");
      expect(result.width).toBe("24");
      expect(result.height).toBe("24");
      expect(result.root.attributes.xmlns).toBe("http://www.w3.org/2000/svg");
    });

    it("handles missing optional attributes", () => {
      const svg = "<svg></svg>";
      const result = parseSvg(svg);

      expect(result.viewBox).toBeUndefined();
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });

    it("preserves element attributes", () => {
      const svg =
        '<svg><path d="M12 2" fill="red" stroke="blue" stroke-width="2"/></svg>';
      const result = parseSvg(svg);

      const path = result.root.children[0];
      expect(path.attributes.d).toBe("M12 2");
      expect(path.attributes.fill).toBe("red");
      expect(path.attributes.stroke).toBe("blue");
      expect(path.attributes["stroke-width"]).toBe("2");
    });
  });

  describe("text content", () => {
    it("parses text elements", () => {
      const svg = "<svg><text>Hello World</text></svg>";
      const result = parseSvg(svg);

      const textElement = result.root.children[0];
      expect(textElement.name).toBe("text");
      expect(textElement.children).toHaveLength(1);
      expect(textElement.children[0].type).toBe("text");
      expect(textElement.children[0].value).toBe("Hello World");
    });

    it("filters whitespace-only text nodes", () => {
      const svg = `<svg>
        <path d="M1 1"/>
      </svg>`;
      const result = parseSvg(svg);

      // Should only have the path, no whitespace text nodes
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].name).toBe("path");
    });
  });

  describe("error handling", () => {
    it("throws for invalid SVG content", () => {
      expect(() => parseSvg("not valid svg")).toThrow(
        "Invalid SVG content: missing <svg> element"
      );
    });

    it("throws for empty string", () => {
      expect(() => parseSvg("")).toThrow(
        "Invalid SVG content: missing <svg> element"
      );
    });

    it("throws for HTML without SVG", () => {
      expect(() => parseSvg("<div>content</div>")).toThrow(
        "Invalid SVG content: missing <svg> element"
      );
    });
  });
});

describe("extractRootSvg", () => {
  it("returns the element if it is an SVG", () => {
    const svgElement: SvgElement = {
      name: "svg",
      type: "element",
      attributes: { viewBox: "0 0 24 24" },
      children: [],
    };

    expect(extractRootSvg(svgElement)).toBe(svgElement);
  });

  it("finds SVG in children", () => {
    const svgElement: SvgElement = {
      name: "svg",
      type: "element",
      attributes: {},
      children: [],
    };

    const wrapper: SvgElement = {
      name: "div",
      type: "element",
      attributes: {},
      children: [svgElement],
    };

    expect(extractRootSvg(wrapper)).toBe(svgElement);
  });

  it("finds SVG in deeply nested structure", () => {
    const svgElement: SvgElement = {
      name: "svg",
      type: "element",
      attributes: {},
      children: [],
    };

    const wrapper: SvgElement = {
      name: "div",
      type: "element",
      attributes: {},
      children: [
        {
          name: "span",
          type: "element",
          attributes: {},
          children: [svgElement],
        },
      ],
    };

    expect(extractRootSvg(wrapper)).toBe(svgElement);
  });

  it("returns null when no SVG found", () => {
    const element: SvgElement = {
      name: "div",
      type: "element",
      attributes: {},
      children: [
        {
          name: "span",
          type: "element",
          attributes: {},
          children: [],
        },
      ],
    };

    expect(extractRootSvg(element)).toBeNull();
  });
});

describe("serializeSvgElement", () => {
  it("serializes a simple element", () => {
    const element: SvgElement = {
      name: "path",
      type: "element",
      attributes: { d: "M12 2" },
      children: [],
    };

    expect(serializeSvgElement(element)).toBe('<path d="M12 2" />');
  });

  it("serializes element with multiple attributes", () => {
    const element: SvgElement = {
      name: "circle",
      type: "element",
      attributes: { cx: "10", cy: "10", r: "5" },
      children: [],
    };

    const result = serializeSvgElement(element);
    expect(result).toContain("cx=");
    expect(result).toContain("cy=");
    expect(result).toContain("r=");
  });

  it("serializes element with children", () => {
    const element: SvgElement = {
      name: "svg",
      type: "element",
      attributes: { viewBox: "0 0 24 24" },
      children: [
        {
          name: "path",
          type: "element",
          attributes: { d: "M12 2" },
          children: [],
        },
      ],
    };

    const result = serializeSvgElement(element);
    expect(result).toContain('<svg viewBox="0 0 24 24">');
    expect(result).toContain("</svg>");
    expect(result).toContain("path");
  });

  it("serializes text nodes", () => {
    const element: SvgElement = {
      name: "#text",
      type: "text",
      attributes: {},
      children: [],
      value: "Hello",
    };

    expect(serializeSvgElement(element)).toBe("Hello");
  });

  it("escapes special XML characters in attributes", () => {
    const element: SvgElement = {
      name: "text",
      type: "element",
      attributes: { title: 'Say "Hello" & <Goodbye>' },
      children: [],
    };

    const result = serializeSvgElement(element);
    expect(result).toContain("&quot;");
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("handles element with no attributes", () => {
    const element: SvgElement = {
      name: "g",
      type: "element",
      attributes: {},
      children: [],
    };

    expect(serializeSvgElement(element)).toBe("<g />");
  });

  it("applies indentation for nested elements", () => {
    const element: SvgElement = {
      name: "svg",
      type: "element",
      attributes: {},
      children: [
        {
          name: "g",
          type: "element",
          attributes: {},
          children: [
            {
              name: "path",
              type: "element",
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    };

    const result = serializeSvgElement(element);
    const lines = result.split("\n");

    // Check indentation increases
    expect(lines[0]).toBe("<svg>");
    expect(lines[1]).toMatch(/^\s{2}<g>/);
    expect(lines[2]).toMatch(/^\s{4}<path/);
  });
});

describe("integration: parse and serialize roundtrip", () => {
  it("can parse and serialize back to valid SVG", () => {
    const originalSvg = '<svg viewBox="0 0 24 24"><path d="M12 2"/></svg>';
    const parsed = parseSvg(originalSvg);
    const serialized = serializeSvgElement(parsed.root);

    // The serialized version should be parseable
    const reparsed = parseSvg(serialized);
    expect(reparsed.viewBox).toBe("0 0 24 24");
    expect(reparsed.root.children[0].name).toBe("path");
  });
});
