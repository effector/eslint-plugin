---
description: Forbid ambiguous target in sample and guard
---

# effector/no-ambiguity-target

Call of `guard`/`sample` with `target` and variable assignment creates ambiguity. One of them should be removed.

```ts
// 👎 should be rewritten
const result = guard({ clock: trigger, filter: Boolean, target })

// 👍 makes sense
guard({ clock: trigger, filter: Boolean, target })
const result = target
```
