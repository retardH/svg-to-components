/**
 * Shared TypeScript types for the SVG Component Generator
 */

/**
 * Represents a parsed SVG attribute
 */
export interface SvgAttribute {
  name: string;
  value: string;
}

/**
 * Represents a parsed SVG element in the AST
 */
export interface SvgElement {
  name: string;
  type: "element" | "text";
  attributes: Record<string, string>;
  children: SvgElement[];
  value?: string;
}

/**
 * Represents the parsed SVG structure
 */
export interface ParsedSvg {
  root: SvgElement;
  viewBox?: string;
  width?: string;
  height?: string;
}

/**
 * Options for the SVG optimizer
 */
export interface OptimizerOptions {
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeTitle?: boolean;
  removeDesc?: boolean;
  removeDimensions?: boolean;
  cleanupIds?: boolean;
}

/**
 * Supported framework targets
 */
export type Framework = "react" | "vue";

/**
 * Options passed to component generators
 */
export interface GeneratorOptions {
  componentName: string;
  svgContent: string;
  props?: boolean;
  typescript?: boolean;
}

/**
 * Result from a component generator
 */
export interface GeneratorResult {
  code: string;
  extension: string;
  framework: Framework;
}

/**
 * CLI command options
 */
export interface CliOptions {
  framework: Framework | Framework[];
  output: string;
  name?: string;
  props?: boolean;
  typescript?: boolean;
}
