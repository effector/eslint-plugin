---
description: Forbid useless calls of `sample` and `guard`
---

# effector/no-useless-methods

Call of `guard` or `sample` without `target` or variable assignment is useless as it does not have any runtime effect. Either add a `target` parameter or assign the result to a variable for later use.

```ts
// 👎 can be omitted
guard({ clock: trigger, filter: Boolean })

// 👍 makes sense
const target1 = guard({ clock: trigger, filter: Boolean })

// 👍 make sense too
guard({ clock: trigger, filter: Boolean, target: target2 })
```
