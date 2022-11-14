# effector/prefer-sample-over-forward-with-mapping

Prefer `sample` over `forward` with `.map`/`.prepend`.

```js
const eventOne = createEvent();
const eventTwo = createEvent();

// 👎 looks weird
forward({
  from: eventOne.map((items) => items.length),
  to: eventTwo,
});

// 👎 weird too
forward({
  from: eventOne,
  to: eventTwo.prepend((items) => items.length),
});

// 👍 better
sample({
  source: eventOne,
  fn: (items) => items.length,
  target: eventTwo,
});
```

💡 Tip: It could be superseded by [no-forward](/rules/no-forward.md).
