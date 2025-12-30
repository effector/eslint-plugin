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

If you are using the flat config format, import the plugin and apply its `recommended` configuration. Here's an example:

```ts
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.configs.recommended, // [!code focus]
]
```

The `recommended` configuration is a preset that enforces best practices for using Effector. To explore all available rules and other presets, refer to the [Rules](./rules/) section of the documentation.

:::info
This plugin requires TypeScript and type-aware linting to be enabled in your ESLint configuration. Refer to the official [`typescript-eslint` documentation](https://typescript-eslint.io/getting-started/typed-linting/) for guidance on providing type information to ESLint.
:::
