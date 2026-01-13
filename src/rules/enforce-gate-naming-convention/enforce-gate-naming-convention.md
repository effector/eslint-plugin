---
description: Enforce a Gate is named capitalized like a React Component
---

# effector/enforce-gate-naming-convention

Enforcing naming conventions helps keep the codebase consistent, and reduces overhead when thinking about how to name a variable with gate. Every gate is a React Component, so it should be named as regular React Component.

## Configuration

```json
{
  "rules": {
    "effector/enforce-gate-naming-convention": "error"
  }
}
```

## Examples

```ts
// 👍 nice name
const MyFavoritePageGate = createGate()

// 👎 bad name
const otherFavoritePageGate = createGate()
```
