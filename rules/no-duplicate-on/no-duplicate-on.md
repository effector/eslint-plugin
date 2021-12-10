# effector/no-duplicate-on

Disallows duplcates `on`-handlers on particular store.

```ts
const increment = createEvent();

// 👍 all explicitly
const $goodCounter = createStore(0).on(increment, (counter) => counter + 1);

// 👎 so, which handler should we choose?
// it's better to remove one of them
const $badCounter = createStore(0)
  .on(increment, (counter) => counter + 1)
  .on(increment, (counter) => counter + 2);
```
