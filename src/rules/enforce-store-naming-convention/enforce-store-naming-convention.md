---
description: Enforce $ as a prefix/postfix for any Effector Store
---

# effector/enforce-store-naming-convention

Enforcing naming conventions helps keep the codebase consistent, and reduces overhead when thinking about how to name a variable with store. Depending on the configuration your `Store`s should be distinguished by a prefix or a postfix `$`. Enforces the prefix convention by default.

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

// 👎 bad name
const name = createStore(null)
```

## Postfix convention

You may also configure this rule to enforce a postfix convention by providing options when enabling the rule:

```js
const config = {
  rules: {
    "effector/enforce-store-naming-convention": ["error", { mode: "postfix" }],
  },
}
```

Then, the postfix convention will be enforced:

```ts
// 👍 nice name
const name$ = createStore(null)

// 👎 bad name
const name = createStrore(null)
```
