/**
 * Generator Registry - Central registry for all framework generators
 */

import type { Framework } from "../core/types.js";
import { BaseGenerator } from "./base.js";
import { ReactGenerator } from "./react.js";
import { VueGenerator } from "./vue.js";

/**
 * Registry of available generators by framework
 */
const generators: Map<Framework, BaseGenerator> = new Map();

/**
 * Register the built-in generators
 */
function registerBuiltInGenerators(): void {
  generators.set("react", new ReactGenerator());
  generators.set("vue", new VueGenerator());
}

// Initialize built-in generators
registerBuiltInGenerators();

/**
 * Get a generator for a specific framework
 * @param framework - Target framework
 * @returns Generator instance or undefined if not found
 */
export function getGenerator(framework: Framework): BaseGenerator | undefined {
  return generators.get(framework);
}

/**
 * Get all registered generators
 * @returns Map of all registered generators
 */
export function getAllGenerators(): Map<Framework, BaseGenerator> {
  return new Map(generators);
}

/**
 * Get list of supported frameworks
 * @returns Array of supported framework names
 */
export function getSupportedFrameworks(): Framework[] {
  return Array.from(generators.keys());
}

/**
 * Register a custom generator
 * @param generator - Generator instance to register
 */
export function registerGenerator(generator: BaseGenerator): void {
  generators.set(generator.framework, generator);
}

export { BaseGenerator } from "./base.js";
export { ReactGenerator } from "./react.js";
export { VueGenerator } from "./vue.js";
