# effector/no-unnecessary-duplication

Same `clock`/`source` in `sample` and `guard` don't make sense, any of these fields can be omitted in this case.

```ts
const $data = createStore(null);

// 👎 can be simplified
const target1 = sample({
  source: $data,
  clock: $data,
  fn(data) {
    return data.length;
  },
});

// 👍 better
const target2 = sample({
  source: $data,
  fn(data) {
    return data.length;
  },
});

// 👍 also nice solution
const target3 = sample({
  clock: $data,
  fn(data) {
    return data.length;
  },
});
```
