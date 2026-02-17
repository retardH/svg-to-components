/**
 * React Generator - Generates React/TSX components from SVG
 */

import synchronizedPrettier from "@prettier/sync";
import { BaseGenerator } from "./base.js";
import type {
  GeneratorOptions,
  GeneratorResult,
  SvgElement,
} from "../core/types.js";
import { parseSvg } from "../core/parser.js";
import { optimizeSvg } from "../core/optimizer.js";
import { transformAttributes } from "../core/transformer.js";

/**
 * React component generator
 */
export class ReactGenerator extends BaseGenerator {
  readonly framework = "react" as const;
  readonly extension = ".tsx";

  generate(options: GeneratorOptions): GeneratorResult {
    const { componentName, svgContent, props = true } = options;

    // Optimize the SVG content
    const optimizedSvg = optimizeSvg(svgContent);

    // Parse the optimized SVG
    const parsed = parseSvg(optimizedSvg);

    // Generate the component code
    const rawCode = this.generateComponent(componentName, parsed.root, props);
    const code = synchronizedPrettier.format(rawCode, {
      parser: "typescript",
      printWidth: 80,
    });

    return {
      code: code.trimEnd(),
      extension: this.extension,
      framework: this.framework,
    };
  }

  /**
   * Generate a React component from parsed SVG
   */
  private generateComponent(
    name: string,
    svgElement: SvgElement,
    includeProps: boolean,
  ): string {
    if (!includeProps) {
      const jsxContent = this.serializeSvgToJsx(svgElement, false);
      return `export function ${name}() {
                return (${jsxContent});
                }
              `;
    }

    const jsxContent = this.serializeSvgToJsx(svgElement, true);
    return `import type { SVGProps } from "react";

            interface ${name}Props extends SVGProps<SVGSVGElement> {
              size?: number | string;
              color?: string;
            }

            export function ${name}({
              size = 24,
              color = "currentColor",
              ...props
            }: ${name}Props) {
              return (
            ${jsxContent}
              );
            }`;
  }

  /**
   * Serialize SVG element to JSX with React-specific transformations
   */
  private serializeSvgToJsx(
    element: SvgElement,
    includeProps: boolean,
  ): string {
    const indent = "    "; // Base indentation for inside the return statement

    if (element.type === "text") {
      return element.value || "";
    }

    // Transform attributes for React (kebab-case to camelCase)
    const attrs = transformAttributes(element.attributes, "react");

    // Build the root SVG element with props injection
    if (element.name === "svg" && includeProps) {
      return this.buildRootSvgJsx(element, attrs, indent);
    }

    // For non-root elements or when props are disabled
    return this.buildElementJsx(element, attrs, indent, includeProps);
  }

  /**
   * Build JSX for the root SVG element with props injection
   */
  private buildRootSvgJsx(
    element: SvgElement,
    attrs: Record<string, string>,
    indent: string,
  ): string {
    // Build attributes, replacing width/height with size and fill with color
    const attrParts: string[] = [];

    // Handle width and height - replace with size prop
    if (attrs.width || attrs.height) {
      attrParts.push("width={size}");
      attrParts.push("height={size}");
      delete attrs.width;
      delete attrs.height;
    } else {
      // Add size props even if not present in original
      attrParts.push("width={size}");
      attrParts.push("height={size}");
    }

    // Handle fill - use color prop if fill is present and not "none"
    if (attrs.fill && attrs.fill !== "none") {
      attrParts.push("fill={color}");
      delete attrs.fill;
    }

    // Add remaining attributes
    for (const [key, value] of Object.entries(attrs)) {
      attrParts.push(this.formatAttribute(key, value));
    }

    // Add spread props at the end
    attrParts.push("{...props}");

    const openTag = `<svg ${attrParts.join(" ")}`;

    if (element.children.length === 0) {
      return `${indent}${openTag} />`;
    }

    const childrenStr = element.children
      .map((child) => this.serializeChildJsx(child, indent + "  "))
      .join("\n");

    return `${indent}${openTag}>\n${childrenStr}\n${indent}</svg>`;
  }

  /**
   * Build JSX for a non-root element
   */
  private buildElementJsx(
    element: SvgElement,
    attrs: Record<string, string>,
    indent: string,
    _includeProps: boolean,
  ): string {
    const attrParts = Object.entries(attrs).map(([key, value]) =>
      this.formatAttribute(key, value),
    );

    const attrsStr = attrParts.length > 0 ? ` ${attrParts.join(" ")}` : "";
    const openTag = `<${element.name}${attrsStr}`;

    if (element.children.length === 0) {
      return `${indent}${openTag} />`;
    }

    const childrenStr = element.children
      .map((child) => this.serializeChildJsx(child, indent + "  "))
      .join("\n");

    return `${indent}${openTag}>\n${childrenStr}\n${indent}</${element.name}>`;
  }

  /**
   * Serialize a child element to JSX
   */
  private serializeChildJsx(element: SvgElement, indent: string): string {
    if (element.type === "text") {
      return `${indent}${element.value || ""}`;
    }

    const attrs = transformAttributes(element.attributes, "react");
    const attrParts = Object.entries(attrs).map(([key, value]) =>
      this.formatAttribute(key, value),
    );

    const attrsStr = attrParts.length > 0 ? ` ${attrParts.join(" ")}` : "";
    const openTag = `<${element.name}${attrsStr}`;

    if (element.children.length === 0) {
      return `${indent}${openTag} />`;
    }

    const childrenStr = element.children
      .map((child) => this.serializeChildJsx(child, indent + "  "))
      .join("\n");

    return `${indent}${openTag}>\n${childrenStr}\n${indent}</${element.name}>`;
  }

  /**
   * Format a single attribute for JSX
   */
  private formatAttribute(key: string, value: string): string {
    // Handle style attribute specially
    if (key === "style") {
      const styleObj = this.parseStyleToObject(value);
      return `style={${JSON.stringify(styleObj)}}`;
    }

    // Use JSX expressions for numeric values
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return `${key}={${value}}`;
    }

    // Escape special characters in string values
    const escapedValue = value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `${key}="${escapedValue}"`;
  }

  /**
   * Parse CSS style string to React style object
   */
  private parseStyleToObject(
    styleString: string,
  ): Record<string, string | number> {
    const styles = styleString.split(";").filter(Boolean);
    const styleObj: Record<string, string | number> = {};

    for (const style of styles) {
      const colonIndex = style.indexOf(":");
      if (colonIndex === -1) continue;

      const property = style.slice(0, colonIndex).trim();
      const value = style.slice(colonIndex + 1).trim();

      if (property && value) {
        // Convert kebab-case to camelCase
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );

        // Convert numeric values
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && value === String(numValue)) {
          styleObj[camelProperty] = numValue;
        } else {
          styleObj[camelProperty] = value;
        }
      }
    }

    return styleObj;
  }
}
