# effector/enforce-gate-naming-convention

Enforcing naming conventions helps keep the codebase consistent, and reduces overhead when thinking about how to name a variable with gate. Every gate is a react-component, so it should be named as regular react-compoent.

```ts
// 👍 nice name
const MyFavoritePageGate = createGate();

// 👎 bad name
const otherFavoritePageGate = createGate();
```
