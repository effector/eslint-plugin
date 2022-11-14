# effector/keep-options-order

Some of Effector-methods (e.g., `sample` and `guard`) accept config in object form. This form can be read as "when `clock` is triggered, take data from `source` pass it through `filter`/`fn` and send to `target`". So, it is better to use semantic order of configuration properties — `clock -> source -> filter/fn -> target`. The rule enforces this order for any case.

```ts
// 👍 great
sample({
  clock: formSubmit,
  source: $formData,
  fn: prepareData,
  target: sendFormToServerFx,
});

// 👎 weird
sample({
  fn: prepareData,
  target: sendFormToServerFx,
  clock: formSubmit,
  source: $formData,
});
```
