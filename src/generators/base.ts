/**
 * Base Generator - Abstract class for framework-specific generators
 */

import type { Framework, GeneratorOptions, GeneratorResult } from "../core/types.js";

/**
 * Abstract base class for component generators
 * Each framework generator extends this class
 */
export abstract class BaseGenerator {
  /**
   * The target framework identifier
   */
  abstract readonly framework: Framework;

  /**
   * The file extension for generated components
   */
  abstract readonly extension: string;

  /**
   * Generate a component from SVG content
   * @param options - Generator options
   * @returns Generated component code and metadata
   */
  abstract generate(options: GeneratorOptions): GeneratorResult;

  /**
   * Format the generated code (optional override)
   * @param code - Raw generated code
   * @returns Formatted code
   */
  protected formatCode(code: string): string {
    return code;
  }
}
