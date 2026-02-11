/**
 * Attribute Transformer - Transforms SVG attributes for different frameworks
 */

import type { Framework } from "./types.js";

/**
 * Map of SVG attributes to their React JSX equivalents
 */
const SVG_TO_REACT_ATTRS: Record<string, string> = {
  "accent-height": "accentHeight",
  "alignment-baseline": "alignmentBaseline",
  "arabic-form": "arabicForm",
  "baseline-shift": "baselineShift",
  "cap-height": "capHeight",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "color-interpolation": "colorInterpolation",
  "color-interpolation-filters": "colorInterpolationFilters",
  "color-profile": "colorProfile",
  "color-rendering": "colorRendering",
  "dominant-baseline": "dominantBaseline",
  "enable-background": "enableBackground",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "flood-color": "floodColor",
  "flood-opacity": "floodOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-size-adjust": "fontSizeAdjust",
  "font-stretch": "fontStretch",
  "font-style": "fontStyle",
  "font-variant": "fontVariant",
  "font-weight": "fontWeight",
  "glyph-name": "glyphName",
  "glyph-orientation-horizontal": "glyphOrientationHorizontal",
  "glyph-orientation-vertical": "glyphOrientationVertical",
  "horiz-adv-x": "horizAdvX",
  "horiz-origin-x": "horizOriginX",
  "image-rendering": "imageRendering",
  "letter-spacing": "letterSpacing",
  "lighting-color": "lightingColor",
  "marker-end": "markerEnd",
  "marker-mid": "markerMid",
  "marker-start": "markerStart",
  "overline-position": "overlinePosition",
  "overline-thickness": "overlineThickness",
  "paint-order": "paintOrder",
  "panose-1": "panose1",
  "pointer-events": "pointerEvents",
  "rendering-intent": "renderingIntent",
  "shape-rendering": "shapeRendering",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "strikethrough-position": "strikethroughPosition",
  "strikethrough-thickness": "strikethroughThickness",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "text-anchor": "textAnchor",
  "text-decoration": "textDecoration",
  "text-rendering": "textRendering",
  "underline-position": "underlinePosition",
  "underline-thickness": "underlineThickness",
  "unicode-bidi": "unicodeBidi",
  "unicode-range": "unicodeRange",
  "units-per-em": "unitsPerEm",
  "v-alphabetic": "vAlphabetic",
  "v-hanging": "vHanging",
  "v-ideographic": "vIdeographic",
  "v-mathematical": "vMathematical",
  "vert-adv-y": "vertAdvY",
  "vert-origin-x": "vertOriginX",
  "vert-origin-y": "vertOriginY",
  "word-spacing": "wordSpacing",
  "writing-mode": "writingMode",
  "x-height": "xHeight",
  "xlink:actuate": "xlinkActuate",
  "xlink:arcrole": "xlinkArcrole",
  "xlink:href": "xlinkHref",
  "xlink:role": "xlinkRole",
  "xlink:show": "xlinkShow",
  "xlink:title": "xlinkTitle",
  "xlink:type": "xlinkType",
  "xml:base": "xmlBase",
  "xml:lang": "xmlLang",
  "xml:space": "xmlSpace",
  xmlns: "xmlns",
  "xmlns:xlink": "xmlnsXlink",
  class: "className",
};

/**
 * Transform an SVG attribute name for a specific framework
 * @param attrName - Original SVG attribute name
 * @param framework - Target framework
 * @returns Transformed attribute name
 */
export function transformAttributeName(
  attrName: string,
  framework: Framework
): string {
  if (framework === "react") {
    return SVG_TO_REACT_ATTRS[attrName] || attrName;
  }

  // Vue keeps SVG attributes as-is
  return attrName;
}

/**
 * Transform inline style string to React style object
 * @param styleString - CSS style string (e.g., "fill: red; stroke: blue")
 * @returns React style object string (e.g., "{ fill: 'red', stroke: 'blue' }")
 */
export function transformStyleToReact(styleString: string): string {
  const styles = styleString.split(";").filter(Boolean);
  const styleObj: Record<string, string> = {};

  for (const style of styles) {
    const [property, value] = style.split(":").map((s) => s.trim());
    if (property && value) {
      // Convert kebab-case to camelCase
      const camelProperty = property.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      styleObj[camelProperty] = value;
    }
  }

  return JSON.stringify(styleObj);
}

/**
 * Convert a filename to a valid component name
 * @param filename - SVG filename (e.g., "arrow-left.svg")
 * @returns Component name (e.g., "ArrowLeftIcon")
 */
export function filenameToComponentName(filename: string): string {
  // Remove extension and path
  const baseName = filename.replace(/^.*[\\/]/, "").replace(/\.svg$/i, "");

  // Convert to PascalCase
  const pascalCase = baseName
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  // Add "Icon" suffix if not already present
  return pascalCase.endsWith("Icon") ? pascalCase : `${pascalCase}Icon`;
}

/**
 * Transform all attributes in an attribute record for a specific framework
 * @param attributes - Original attributes
 * @param framework - Target framework
 * @returns Transformed attributes
 */
export function transformAttributes(
  attributes: Record<string, string>,
  framework: Framework
): Record<string, string> {
  const transformed: Record<string, string> = {};

  for (const [key, value] of Object.entries(attributes)) {
    const newKey = transformAttributeName(key, framework);
    transformed[newKey] = value;
  }

  return transformed;
}

/**
 * Options for JSX serialization
 */
export interface JsxSerializeOptions {
  /** Attributes to replace on the root SVG element */
  rootAttributes?: Record<string, string>;
  /** Whether to use JSX expressions for certain attributes */
  useExpressions?: boolean;
}

import type { SvgElement } from "./types.js";

/**
 * Serialize an SvgElement to React JSX string
 * @param element - SvgElement to serialize
 * @param options - Serialization options
 * @param indent - Current indentation level
 * @param isRoot - Whether this is the root element
 * @returns JSX string
 */
export function serializeToJsx(
  element: SvgElement,
  options: JsxSerializeOptions = {},
  indent = 2,
  isRoot = true
): string {
  const indentStr = " ".repeat(indent);

  if (element.type === "text") {
    return element.value || "";
  }

  // Get attributes, applying transformations for React
  let attrs = transformAttributes(element.attributes, "react");

  // Apply root attribute overrides for the root SVG element
  if (isRoot && element.name === "svg" && options.rootAttributes) {
    attrs = { ...attrs, ...options.rootAttributes };
  }

  // Format attributes for JSX
  const attrsStr = formatJsxAttributes(attrs, options.useExpressions ?? true);
  const openTag = attrsStr ? `<${element.name} ${attrsStr}` : `<${element.name}`;

  if (element.children.length === 0) {
    return `${indentStr}${openTag} />`;
  }

  const childIndent = indent + 2;
  const childrenStr = element.children
    .map((child) => serializeToJsx(child, options, childIndent, false))
    .join("\n");

  return `${indentStr}${openTag}>\n${childrenStr}\n${indentStr}</${element.name}>`;
}

/**
 * Format attributes as JSX attribute string
 * @param attrs - Attributes to format
 * @param useExpressions - Whether to use JSX expressions for certain values
 * @returns Formatted attribute string
 */
function formatJsxAttributes(
  attrs: Record<string, string>,
  useExpressions: boolean
): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      // Handle style attribute specially for React
      if (key === "style" && useExpressions) {
        const styleObj = parseStyleString(value);
        return `style={${JSON.stringify(styleObj)}}`;
      }

      // Use JSX expressions for numeric values or special cases
      if (useExpressions && isNumericValue(value)) {
        return `${key}={${value}}`;
      }

      return `${key}="${escapeJsxAttribute(value)}"`;
    })
    .join(" ");
}

/**
 * Parse CSS style string into React style object
 * @param styleString - CSS style string
 * @returns Style object with camelCase keys
 */
function parseStyleString(styleString: string): Record<string, string | number> {
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
        letter.toUpperCase()
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

/**
 * Check if a value is purely numeric
 * @param value - Value to check
 * @returns True if numeric
 */
function isNumericValue(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

/**
 * Escape special characters for JSX attributes
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeJsxAttribute(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");
}
