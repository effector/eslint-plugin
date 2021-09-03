# effector/prefer-sample-over-forward-with-mapping

Prefer `sample` over `forward` with `.map`/`.prepend`.

```js
const eventOne = createEvent();
const eventTwo = createEvent();

// 👎 looks weird
forward({
  from: eventOne.map((items) => item.length),
  to: eventTwo,
});

// 👎 weird too
forward({
  from: eventOne,
  to: eventTwo.prepend((items) => item.length),
});

// 👍 better
sample({
  source: eventOne,
  fn: (items) => item.length,
  target: eventTwo,
});
```
