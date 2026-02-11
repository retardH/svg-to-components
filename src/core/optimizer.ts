/**
 * SVG Optimizer - Integrates with SVGO for SVG optimization
 */

import { optimize, type Config } from "svgo";
import type { OptimizerOptions } from "./types.js";

/**
 * Default SVGO configuration
 */
export const defaultSvgoConfig: Config = {
  plugins: [
    "preset-default",
    "removeXMLNS",
    {
      name: "removeAttrs",
      params: {
        attrs: ["xml:space"],
      },
    },
  ],
};

/**
 * Optimize SVG content using SVGO
 * @param svgContent - Raw SVG string content
 * @param options - Optimization options
 * @returns Optimized SVG string
 */
export function optimizeSvg(
  svgContent: string,
  options: OptimizerOptions = {}
): string {
  const config = buildConfig(options);
  const result = optimize(svgContent, config);
  return result.data;
}

/**
 * Build SVGO config from optimizer options
 * @param options - Optimizer options
 * @returns SVGO configuration
 */
function buildConfig(options: OptimizerOptions): Config {
  const plugins: Config["plugins"] = ["preset-default"];

  if (options.removeComments !== false) {
    plugins.push("removeComments");
  }

  if (options.removeMetadata !== false) {
    plugins.push("removeMetadata");
  }

  if (options.removeTitle) {
    plugins.push("removeTitle");
  }

  if (options.removeDesc) {
    plugins.push("removeDesc");
  }

  if (options.removeDimensions) {
    plugins.push("removeDimensions");
  }

  if (options.cleanupIds !== false) {
    plugins.push("cleanupIds");
  }

  plugins.push("removeXMLNS");

  return { plugins };
}
