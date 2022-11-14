# effector/no-useless-methods

Call of `gaurd`/`sample` without `target` or variable assignment is useless. It can be omitted from source code.

```ts
// 👎 can be omitted
guard({ clock: trigger, filter: Boolean });

// 👍 makes sense
const target1 = guard({ clock: trigger, filter: Boolean });

// 👍 make sense too
guard({ clock: trigger, filter: Boolean, target: target2 });
```
