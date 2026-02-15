#!/usr/bin/env node
/**
 * CLI Entry Point - Command-line interface for SVG Component Generator
 */

import { Command } from "commander";
import chalk from "chalk";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  mkdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename, extname } from "node:path";
import { globSync, hasMagic } from "glob";
import type { Framework, GeneratorResult } from "../core/types.js";
import { getGenerator } from "../generators/index.js";
import { filenameToComponentName } from "../core/transformer.js";

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

/**
 * Resolves CLI file arguments (globs and literal paths) to a deduplicated list of SVG file paths.
 */
function resolveInputFiles(files: string[]): string[] {
  const resolved = new Set<string>();

  for (const input of files) {
    const normalized = resolve(input);

    if (hasMagic(normalized)) {
      const matches = globSync(normalized, { nodir: true });
      for (const p of matches) {
        if (p.toLowerCase().endsWith(".svg")) {
          resolved.add(resolve(p));
        }
      }
    } else {
      if (existsSync(normalized)) {
        const stat = statSync(normalized);
        if (stat.isFile() && normalized.toLowerCase().endsWith(".svg")) {
          resolved.add(normalized);
        }
      }
    }
  }

  return Array.from(resolved).sort();
}

/**
 * Parses the framework option (e.g. "react", "vue", "react,vue") into a list of Framework values.
 */
function parseFrameworks(value: string): Framework[] {
  const frameworks = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Framework => s === "react" || s === "vue");
  return frameworks.length > 0 ? frameworks : ["react"];
}

/**
 * Process each SVG file and generate component code for the requested frameworks.
 */
function processAndGenerate(
  svgPaths: string[],
  options: {
    framework: string;
    name?: string;
    props?: boolean;
    typescript?: boolean;
  },
): { filePath: string; componentName: string; results: GeneratorResult[] }[] {
  const frameworks = parseFrameworks(options.framework);
  const useCustomName =
    options.name !== undefined && options.name.trim() !== "";
  const singleFile = svgPaths.length === 1;

  return svgPaths.map((filePath) => {
    const svgContent = readFileSync(filePath, "utf-8");
    const componentName =
      singleFile && useCustomName
        ? options.name!.trim()
        : filenameToComponentName(basename(filePath));

    const results: GeneratorResult[] = [];
    for (const framework of frameworks) {
      const generator = getGenerator(framework);
      if (!generator) continue;
      const result = generator.generate({
        componentName,
        svgContent,
        props: options.props,
        typescript: options.typescript,
      });
      results.push(result);
    }
    return { filePath, componentName, results };
  });
}

const COMPONENT_EXTENSIONS = [".tsx", ".jsx", ".vue", ".ts", ".js"];

function isOutputFile(outputPath: string): boolean {
  const resolved = resolve(outputPath);
  if (existsSync(resolved)) {
    return statSync(resolved).isFile();
  }
  return COMPONENT_EXTENSIONS.includes(extname(resolved).toLowerCase());
}

/**
 * Writes generated components to disk.
 * - If output is a file: inserts the new component into the file (appends to existing content).
 * - If output is a directory: creates new component files in that directory.
 */
function writeOutput(
  generated: {
    filePath: string;
    componentName: string;
    results: GeneratorResult[];
  }[],
  outputPath: string,
): void {
  const resolvedOutput = resolve(outputPath);
  const outputIsFile = isOutputFile(resolvedOutput);

  const totalResults = generated.reduce((sum, g) => sum + g.results.length, 0);

  if (outputIsFile) {
    if (totalResults !== 1) {
      throw new Error(
        "Output as file is only supported when converting a single SVG to a single framework.",
      );
    }
    const { code } = generated[0]!.results[0]!;
    const existingContent = existsSync(resolvedOutput)
      ? readFileSync(resolvedOutput, "utf-8")
      : "";
    const separator = existingContent.trimEnd() ? "\n\n" : "";
    writeFileSync(resolvedOutput, existingContent + separator + code, "utf-8");
  } else {
    mkdirSync(resolvedOutput, { recursive: true });
    for (const { componentName, results } of generated) {
      for (const result of results) {
        const outPath = join(
          resolvedOutput,
          `${componentName}${result.extension}`,
        );
        writeFileSync(outPath, result.code, "utf-8");
      }
    }
  }
}

const program = new Command();

program
  .name("svg-gen")
  .description("Convert SVG files into React and Vue components")
  .version(packageJson.version);

program
  .argument("<files...>", "SVG file(s) to convert (supports glob patterns)")
  .option(
    "-f, --framework <framework>",
    "Target framework (react, vue, or react,vue)",
    "react",
  )
  .option(
    "-o, --output <path>",
    "Output file or directory (dir: create new files; file: overwrite single component)",
    "./components",
  )
  .option("-n, --name <name>", "Component name (only for single file)")
  .option("--no-props", "Generate component without size/color props")
  .option("--typescript", "Generate TypeScript components", true)
  .action(async (files: string[], options) => {
    try {
      console.log(chalk.blue("SVG Component Generator"));
      console.log(chalk.gray(`Input: ${files.length} pattern(s)...`));

      const svgPaths = resolveInputFiles(files);
      if (svgPaths.length === 0) {
        console.error(chalk.red("No SVG files found."));
        process.exit(1);
      }
      console.log(chalk.gray(`Resolved to ${svgPaths.length} SVG file(s).`));

      const generated = processAndGenerate(svgPaths, {
        framework: options.framework,
        name: options.name,
        props: options.props,
        typescript: options.typescript,
      });
      const totalComponents = generated.reduce(
        (sum, g) => sum + g.results.length,
        0,
      );
      console.log(
        chalk.green(
          `Generated ${totalComponents} component(s) from ${generated.length} file(s).`,
        ),
      );
      for (const { componentName, results } of generated) {
        for (const r of results) {
          console.log(chalk.gray(`  ${componentName} (${r.framework})`));
        }
      }

      writeOutput(generated, options.output);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program.parse();
