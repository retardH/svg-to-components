/**
 * Vue Generator - Generates Vue SFC components from SVG
 */

import { BaseGenerator } from "./base.js";
import type { GeneratorOptions, GeneratorResult } from "../core/types.js";

/**
 * Vue SFC component generator
 */
export class VueGenerator extends BaseGenerator {
  readonly framework = "vue" as const;
  readonly extension = ".vue";

  generate(options: GeneratorOptions): GeneratorResult {
    const { componentName, svgContent, props = true } = options;

    // TODO: Implement full Vue component generation
    // - Keep SVG attributes as-is (kebab-case)
    // - Add script setup with props
    // - Bind props to SVG attributes

    const code = this.generateComponent(componentName, svgContent, props);

    return {
      code,
      extension: this.extension,
      framework: this.framework,
    };
  }

  private generateComponent(
    _name: string,
    svgContent: string,
    includeProps: boolean
  ): string {
    if (!includeProps) {
      return `<template>
  ${svgContent}
</template>
`;
    }

    return `<script setup lang="ts">
interface Props {
  size?: number | string;
  color?: string;
}

withDefaults(defineProps<Props>(), {
  size: 24,
  color: "currentColor",
});
</script>

<template>
  ${svgContent}
</template>
`;
  }
}
