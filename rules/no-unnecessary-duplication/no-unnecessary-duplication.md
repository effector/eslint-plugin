# Forbids same `clock` and `source` inside method config (`effector/no-unnecessary-duplication`)

Same `clock`/`source` in `sample` and `guard` don't make sense, any of these fields can be omitted in this case.

```ts
const $data = createStore(null);

// 👎 can be simplified
const target = sample({
  source: $data,
  clock: $data,
  fn(data) {
    return data.length;
  },
});

// 👍 better
const target = sample({
  source: $data,
  fn(data) {
    return data.length;
  },
});

// 👍 also possible
const target = sample({
  clock: $data,
  fn(data) {
    return data.length;
  },
});
```
