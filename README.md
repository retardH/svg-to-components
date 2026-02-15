# SVG Component Generator

CLI and programmatic utilities to convert SVG files into React and Vue
components. It optimizes SVGs with SVGO, normalizes attributes, and outputs
formatted components.

## Features

- React and Vue output (`.tsx`/`.jsx` and `.vue`)
- Optional size/color props for React components
- Batch conversion with glob patterns
- Output to a directory or a single file

## Install

Node.js 18+ is required.

```bash
pnpm install
pnpm build
```

If installed as a dependency (local or global), the CLI is available as
`svg-gen`.

## CLI Usage

```bash
svg-gen <files...> [options]
```

Examples:

```bash
svg-gen "icons/*.svg" -f react -o ./components
svg-gen ./icons/close.svg -f vue -o ./components
svg-gen ./icons/close.svg -f react -o ./src/icons.tsx -n CloseIcon
```

## Options

- `-f, --framework <framework>`: `react`, `vue`, or `react,vue` (default: `react`)
- `-o, --output <path>`: output directory or file (default: `./components`)
- `-n, --name <name>`: component name (single file only)
- `--no-props`: omit size/color props (React)
- `--typescript`: generate TypeScript components (default: `true`)

Notes:

- Output to a file only works for a single SVG and single framework.

## Programmatic API

Import from the package entry to parse, optimize, and generate components:

```ts
import { ReactGenerator, VueGenerator } from "svg-component-generator";
```
