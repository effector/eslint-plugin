---
aside: false
---

<script setup>
import { data } from "./index.data"

const rulesByCategory = (category) => data.filter((rule) => rule.category === category)
</script>

# Rules

## `recommended`

This preset is recommended for most projects, so we suggest enabling it by default.

::: code-group

```ts [eslint.config.mjs]
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.configs.recommended, // [!code focus]
]
```

:::

<RuleTable :rules='rulesByCategory("recommended")' />

## `patronum`

This preset is recommended for projects that use [`patronum`](https://patronum.effector.dev/).

::: code-group

```ts [eslint.config.mjs]
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.configs.patronum, // [!code focus]
]
```

:::

<RuleTable :rules='rulesByCategory("patronum")' />

## `react`

This preset is recommended for projects that use React with Effector.

::: code-group

```ts [eslint.config.mjs]
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.configs.react, // [!code focus]
]
```

:::

<RuleTable :rules='rulesByCategory("react")' />

## `scope`

This preset is recommended for projects that use [Fork API](https://effector.dev/docs/api/effector/scope).

::: code-group

```ts [eslint.config.mjs]
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.configs.scope, // [!code focus]
]
```

:::

<RuleTable :rules='rulesByCategory("scope")' />

## `future`

Effector is evolving! Future-proof your code with this preset, which enforces best practices for future releases of Effector.

::: code-group

```ts [eslint.config.mjs]
import effector from "eslint-plugin-effector" // [!code focus]

const config = [
  effector.configs.future, // [!code focus]
]
```

:::

<RuleTable :rules='rulesByCategory("future")' />

## Other Rules

Some ESLint rules are yet to be included in any preset but can be enabled individually if they suit your project's needs.

<RuleTable :rules='rulesByCategory(undefined)' />
