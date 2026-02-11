import { describe, it, expect } from "vitest";
import {
  transformAttributeName,
  transformStyleToReact,
  filenameToComponentName,
  transformAttributes,
  serializeToJsx,
} from "./transformer.js";
import type { SvgElement } from "./types.js";

describe("transformAttributeName", () => {
  describe("for React", () => {
    it("transforms stroke-width to strokeWidth", () => {
      expect(transformAttributeName("stroke-width", "react")).toBe("strokeWidth");
    });

    it("transforms fill-rule to fillRule", () => {
      expect(transformAttributeName("fill-rule", "react")).toBe("fillRule");
    });

    it("transforms class to className", () => {
      expect(transformAttributeName("class", "react")).toBe("className");
    });

    it("transforms xlink:href to xlinkHref", () => {
      expect(transformAttributeName("xlink:href", "react")).toBe("xlinkHref");
    });

    it("keeps unknown attributes unchanged", () => {
      expect(transformAttributeName("d", "react")).toBe("d");
      expect(transformAttributeName("viewBox", "react")).toBe("viewBox");
    });
  });

  describe("for Vue", () => {
    it("keeps all attributes unchanged", () => {
      expect(transformAttributeName("stroke-width", "vue")).toBe("stroke-width");
      expect(transformAttributeName("fill-rule", "vue")).toBe("fill-rule");
      expect(transformAttributeName("class", "vue")).toBe("class");
    });
  });
});

describe("transformStyleToReact", () => {
  it("converts simple style string to JSON object", () => {
    const result = transformStyleToReact("fill: red");
    expect(JSON.parse(result)).toEqual({ fill: "red" });
  });

  it("converts multiple styles", () => {
    const result = transformStyleToReact("fill: red; stroke: blue");
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ fill: "red", stroke: "blue" });
  });

  it("converts kebab-case properties to camelCase", () => {
    const result = transformStyleToReact("stroke-width: 2; fill-opacity: 0.5");
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ strokeWidth: "2", fillOpacity: "0.5" });
  });

  it("handles trailing semicolons", () => {
    const result = transformStyleToReact("fill: red;");
    expect(JSON.parse(result)).toEqual({ fill: "red" });
  });

  it("handles empty style string", () => {
    const result = transformStyleToReact("");
    expect(JSON.parse(result)).toEqual({});
  });
});

describe("filenameToComponentName", () => {
  it("converts kebab-case filename to PascalCase with Icon suffix", () => {
    expect(filenameToComponentName("arrow-left.svg")).toBe("ArrowLeftIcon");
  });

  it("converts snake_case filename", () => {
    expect(filenameToComponentName("arrow_right.svg")).toBe("ArrowRightIcon");
  });

  it("converts space-separated filename", () => {
    expect(filenameToComponentName("arrow up.svg")).toBe("ArrowUpIcon");
  });

  it("handles filename with path", () => {
    expect(filenameToComponentName("/icons/arrow-down.svg")).toBe("ArrowDownIcon");
  });

  it("handles Windows-style paths", () => {
    expect(filenameToComponentName("C:\\icons\\arrow-down.svg")).toBe("ArrowDownIcon");
  });

  it("doesn't add Icon suffix if already present", () => {
    expect(filenameToComponentName("arrow-icon.svg")).toBe("ArrowIcon");
  });

  it("handles single word filename", () => {
    expect(filenameToComponentName("home.svg")).toBe("HomeIcon");
  });

  it("handles mixed case input", () => {
    expect(filenameToComponentName("MyArrow.svg")).toBe("MyarrowIcon");
  });
});

describe("transformAttributes", () => {
  it("transforms all attributes for React", () => {
    const attrs = {
      "stroke-width": "2",
      "fill-rule": "evenodd",
      class: "icon",
      d: "M12 2",
    };

    const result = transformAttributes(attrs, "react");

    expect(result).toEqual({
      strokeWidth: "2",
      fillRule: "evenodd",
      className: "icon",
      d: "M12 2",
    });
  });

  it("keeps all attributes unchanged for Vue", () => {
    const attrs = {
      "stroke-width": "2",
      "fill-rule": "evenodd",
      class: "icon",
    };

    const result = transformAttributes(attrs, "vue");

    expect(result).toEqual({
      "stroke-width": "2",
      "fill-rule": "evenodd",
      class: "icon",
    });
  });
});

describe("serializeToJsx", () => {
  it("serializes a simple element", () => {
    const element: SvgElement = {
      name: "path",
      type: "element",
      attributes: { d: "M12 2" },
      children: [],
    };

    const result = serializeToJsx(element);
    expect(result).toContain('<path d="M12 2" />');
  });

  it("transforms kebab-case attributes to camelCase", () => {
    const element: SvgElement = {
      name: "path",
      type: "element",
      attributes: { "stroke-width": "2", "fill-rule": "evenodd" },
      children: [],
    };

    const result = serializeToJsx(element);
    expect(result).toContain("strokeWidth");
    expect(result).toContain("fillRule");
    expect(result).not.toContain("stroke-width");
    expect(result).not.toContain("fill-rule");
  });

  it("converts numeric values to JSX expressions", () => {
    const element: SvgElement = {
      name: "circle",
      type: "element",
      attributes: { cx: "10", cy: "10", r: "5" },
      children: [],
    };

    const result = serializeToJsx(element);
    expect(result).toContain("cx={10}");
    expect(result).toContain("cy={10}");
    expect(result).toContain("r={5}");
  });

  it("handles style attributes as objects", () => {
    const element: SvgElement = {
      name: "rect",
      type: "element",
      attributes: { style: "fill: red; stroke-width: 2" },
      children: [],
    };

    const result = serializeToJsx(element);
    expect(result).toContain("style={");
  });

  it("serializes nested elements", () => {
    const element: SvgElement = {
      name: "svg",
      type: "element",
      attributes: { viewBox: "0 0 24 24" },
      children: [
        {
          name: "g",
          type: "element",
          attributes: {},
          children: [
            {
              name: "path",
              type: "element",
              attributes: { d: "M12 2" },
              children: [],
            },
          ],
        },
      ],
    };

    const result = serializeToJsx(element);
    expect(result).toContain("<svg");
    expect(result).toContain("<g>");
    expect(result).toContain("<path");
    expect(result).toContain("</g>");
    expect(result).toContain("</svg>");
  });

  it("serializes text nodes", () => {
    const element: SvgElement = {
      name: "#text",
      type: "text",
      attributes: {},
      children: [],
      value: "Hello",
    };

    const result = serializeToJsx(element);
    expect(result).toBe("Hello");
  });

  it("applies root attributes override", () => {
    const element: SvgElement = {
      name: "svg",
      type: "element",
      attributes: { viewBox: "0 0 24 24", width: "24" },
      children: [],
    };

    const result = serializeToJsx(element, {
      rootAttributes: { width: "100", height: "100" },
    });

    // Check that root attributes are applied (width/height overridden)
    expect(result).toContain("width={100}");
    expect(result).toContain("height={100}");
    // Original width="24" should not be present
    expect(result).not.toContain('width="24"');
  });

  it("escapes special characters in attribute values", () => {
    const element: SvgElement = {
      name: "text",
      type: "element",
      attributes: { title: 'Say "Hello" & <Goodbye>' },
      children: [],
    };

    const result = serializeToJsx(element);
    expect(result).toContain("&quot;");
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });
});
