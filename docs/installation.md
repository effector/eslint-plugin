# Installation

To install and configure this ESLint plugin, follow the steps below:

## Install the Plugin

Use your preferred package manager to install the plugin along with ESLint:

::: code-group

```sh [npm]
npm install --save-dev eslint-plugin-effector eslint
```

```sh [yarn]
yarn add --dev eslint-plugin-effector eslint
```

```sh [pnpm]
pnpm install --save-dev eslint-plugin-effector eslint
```

:::

## Configure ESLint

With the flat config format, import the plugin and apply its `recommended` configuration. Here's an example:

```ts [eslint.config.js]
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.flatConfigs.recommended, // [!code focus]
]
```

The `recommended` configuration is a preset that enforces best practices for using Effector. To explore all available rules and other presets, refer to the [Rules](./rules/) section of the documentation.

:::tip
This plugin requires TypeScript and type-aware linting to be enabled in your ESLint configuration. Refer to the official [`typescript-eslint` installation guide](https://typescript-eslint.io/getting-started/typed-linting/) for guidance on providing type information to ESLint.
:::

::: details Legacy Config (`.eslintrc`)
If you're using the legacy `.eslintrc` configuration format in ESLint v8, you can still configure the plugin and presets using the following syntax:

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/recommended"]
}
```

This plugin uses type information, you'll also need to set up `@typescript-eslint/parser` in your configuration following their [legacy installation guide](https://typescript-eslint.io/getting-started/legacy-eslint-setup/).

Other presets are also available in this legacy format under the same names, see the [Rules](./rules/) section.
:::
