<h1 align="center">eslint-plugin-effector</h1>

An ESLint plugin for enforcing best practices for [Effector](https://effector.dev).

For comprehensive documentation, including rules and configuration guides, visit official documentation at [eslint.effector.dev](https://eslint.effector.dev).

## Installation

First, install [ESLint](https://eslint.org) and the plugin:

```bash
# pnpm
pnpm add --save-dev eslint eslint-plugin-effector

# yarn
yarn add --dev eslint eslint-plugin-effector

# npm
npm install --save-dev eslint eslint-plugin-effector
```

## Usage

This plugin supports the new [flat config format](https://eslint.org/docs/latest/use/configure/configuration-files) for ESLint. Start by adding the `recommended` preset to your `eslint.config.js`:

```js
// eslint.config.js
import effector from "eslint-plugin-effector"

export default [
  /* ... */

  // Include the recommended preset:
  effector.flatConfigs.recommended,
]
```

To explore all available presets, refer to the [Rules](https://eslint.effector.dev/rules/) section of the documentation. For more details or legacy config usage, see the [Installation](https://eslint.effector.dev/installation/) section.

### TypeScript Requirement

This plugin leverages TypeScript for accurate linting. You must have TypeScript and type-aware linting configured. For setup instructions, please see the [official `typescript-eslint` documentation](https://typescript-eslint.io/getting-started/typed-linting/).
