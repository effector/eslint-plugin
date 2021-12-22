# effector/no-unnecessary-combination

Call of `combine`/`merge` in `clock`/`source` is unnecessary. It can be omitted from source code.

```ts
// 👎 can be simplified
const badEventOne = guard({
  clock: combine($store1, $store2),
  filter: $filter,
});
const badEventOne = guard({
  clock: combine($store1, $store2, (store1, store2) => ({
    x: store1,
    y: store2,
  })),
  filter: $filter,
});

// 👍 better
const goodEventOne = guard({ clock: [$store1, $store2], filter: $filter });
const goodEventTwo = guard({
  clock: { x: $store1, x: $store2 },
  filter: $filter,
});
```
