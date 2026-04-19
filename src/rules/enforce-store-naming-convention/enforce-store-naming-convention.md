---
description: Enforce $ as a prefix/postfix for any Effector Store
---

# effector/enforce-store-naming-convention

Enforces Effector naming conventions to reduce code reading overhead by clearly and consistently marking all `Store`s with a `$` symbol across the codebase.

Depending on rule configuration, `Store`s must be distinguished from other variables by a `$` prefix or postfix, with prefix enforcement as the default.

## Prefix convention

When configured without options, a prefix convention will be enforced. This is the default behavior of the `recommended` preset.

```js
const config = {
  rules: {
    "effector/enforce-store-naming-convention": "error",
  },
}
```

```ts
// 👍 nice name
const $name = createStore(null)
const { $x, $y } = useContext(PointModel)

// 👎 bad name
const name = createStore(null)
const { x, y } = useContext(PointModel)
```

## Postfix convention

You may also configure this rule to enforce a postfix convention by providing options when enabling the rule:

```js
const config = {
  rules: {
    "effector/enforce-store-naming-convention": ["error", { mode: "postfix" }], // [!code focus]
  },
}
```

Then, the postfix convention will be enforced:

```ts
// 👍 nice name
const name$ = createStore(null)
const { x$, y$ } = useContext(PointModel)

// 👎 bad name
const name = createStore(null)
const { x, y } = useContext(PointModel)
```
