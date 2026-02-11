/**
 * SVG Component Generator - Programmatic API
 *
 * Convert SVG files into React and Vue components
 */

// Core exports
export {
  parseSvg,
  isValidSvg,
  extractRootSvg,
  serializeSvgElement,
} from "./core/parser.js";
export { optimizeSvg, defaultSvgoConfig } from "./core/optimizer.js";
export {
  transformAttributeName,
  transformStyleToReact,
  filenameToComponentName,
} from "./core/transformer.js";
export type {
  Framework,
  GeneratorOptions,
  GeneratorResult,
  OptimizerOptions,
  ParsedSvg,
  SvgElement,
  CliOptions,
} from "./core/types.js";

// Generator exports
export {
  BaseGenerator,
  ReactGenerator,
  VueGenerator,
  getGenerator,
  getAllGenerators,
  getSupportedFrameworks,
  registerGenerator,
} from "./generators/index.js";
