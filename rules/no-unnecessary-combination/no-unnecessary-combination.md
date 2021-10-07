# effector/no-unnecessary-combination

Call of `combine`/`merge` in `clock`/`source` is unnecessary. It can be omitted from source code.

```ts
// 👎 can be simplifies
const eventOne = guard({ clock: combine($store1, $store2), filter: $filter });

// 👍 better
const eventTwo = guard({ clock: [$store1, $store2], filter: $filter });
```
