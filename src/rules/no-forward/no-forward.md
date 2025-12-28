---
description: Prefer sample over forward
---

# effector/no-forward

Any `forward` call could be replaced with `sample` call.

```ts
// 👎 could be replaced
forward({ from: trigger, to: reaction })

// 👍 makes sense
sample({ clock: trigger, target: reaction })
```

Nice bonus: `sample` is extendable. You can add transformation by `fn` and filtering by `filter`.

```ts
// 👎 could be replaced
forward({ from: trigger.map((value) => value.length), to: reaction })

// 👍 makes sense
sample({ clock: trigger, fn: (value) => value.length, target: reaction })
```
