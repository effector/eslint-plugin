# effector/no-inline-units

Disallows to use inline units in methods

```ts
// 👎 Bad
sample({ source: $somestore, target: createEffect() });

// 👍 Good
const effectFx = createEffect();

sample({ source: $somestore, target: effectFx });
```
