/**
 * SVG Parser - Parses SVG content into a structured format
 */

import svgoParser from "svgo/lib/parser.js";
import type { XastElement, XastChild, XastRoot } from "svgo/lib/types.js";

const svgoParse = svgoParser.parseSvg;
import type { ParsedSvg, SvgElement } from "./types.js";

/**
 * Parse SVG string content into a structured AST
 * @param svgContent - Raw SVG string content
 * @returns Parsed SVG structure
 * @throws Error if SVG is invalid or cannot be parsed
 */
export function parseSvg(svgContent: string): ParsedSvg {
  if (!isValidSvg(svgContent)) {
    throw new Error("Invalid SVG content: missing <svg> element");
  }

  const ast = svgoParse(svgContent);
  const svgElement = findSvgElement(ast);

  if (!svgElement) {
    throw new Error("Could not find SVG element in parsed content");
  }

  const root = convertToSvgElement(svgElement);

  return {
    root,
    viewBox: svgElement.attributes.viewBox,
    width: svgElement.attributes.width,
    height: svgElement.attributes.height,
  };
}

/**
 * Find the root SVG element in the parsed AST
 * @param ast - SVGO parsed AST root
 * @returns The SVG XastElement or null
 */
function findSvgElement(ast: XastRoot): XastElement | null {
  for (const child of ast.children) {
    if (child.type === "element" && child.name === "svg") {
      return child;
    }
  }
  return null;
}

/**
 * Convert SVGO XastElement to our SvgElement format
 * @param element - SVGO element
 * @returns Converted SvgElement
 */
function convertToSvgElement(element: XastElement): SvgElement {
  const children: SvgElement[] = [];

  for (const child of element.children) {
    const converted = convertChild(child);
    if (converted) {
      children.push(converted);
    }
  }

  return {
    name: element.name,
    type: "element",
    attributes: { ...element.attributes },
    children,
  };
}

/**
 * Convert a SVGO child node to our SvgElement format
 * @param child - SVGO child node
 * @returns Converted SvgElement or null for unsupported types
 */
function convertChild(child: XastChild): SvgElement | null {
  if (child.type === "element") {
    return convertToSvgElement(child);
  }

  if (child.type === "text") {
    // Only include non-whitespace text nodes
    const trimmedValue = child.value.trim();
    if (trimmedValue) {
      return {
        name: "#text",
        type: "text",
        attributes: {},
        children: [],
        value: child.value,
      };
    }
  }

  // Skip comments, cdata, doctype, instruction nodes
  return null;
}

/**
 * Extract the root SVG element from a parsed SvgElement tree
 * Useful when dealing with nested structures
 * @param element - Parsed SVG element tree
 * @returns Root SVG element or null if not found
 */
export function extractRootSvg(element: SvgElement): SvgElement | null {
  if (element.name === "svg") {
    return element;
  }

  for (const child of element.children) {
    const found = extractRootSvg(child);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Validate that the content is valid SVG
 * @param content - Content to validate
 * @returns True if valid SVG
 */
export function isValidSvg(content: string): boolean {
  // Basic validation - check for svg tag (both self-closing and with closing tag)
  return /<svg[^>]*(?:\/>|>[\s\S]*<\/svg>)/i.test(content);
}

/**
 * Serialize an SvgElement back to an SVG string
 * @param element - SvgElement to serialize
 * @param indent - Current indentation level
 * @returns SVG string
 */
export function serializeSvgElement(element: SvgElement, indent = 0): string {
  const indentStr = "  ".repeat(indent);

  if (element.type === "text") {
    return element.value || "";
  }

  const attrs = Object.entries(element.attributes)
    .map(([key, value]) => `${key}="${escapeXml(value)}"`)
    .join(" ");

  const openTag = attrs ? `<${element.name} ${attrs}` : `<${element.name}`;

  if (element.children.length === 0) {
    return `${indentStr}${openTag} />`;
  }

  const childrenStr = element.children
    .map((child) => serializeSvgElement(child, indent + 1))
    .join("\n");

  return `${indentStr}${openTag}>\n${childrenStr}\n${indentStr}</${element.name}>`;
}

/**
 * Escape special XML characters
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
