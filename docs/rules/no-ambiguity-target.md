# effector/no-ambiguity-target

Call of `guard`/`sample` with `target` and variable assignment is ambiguity. One of them should be omitted from source code.

```ts
// 👎 should be rewritten
const result = guard({ clock: trigger, filter: Boolean, target });

// 👍 makes sense
guard({ clock: trigger, filter: Boolean, target });
const result = target;
```
