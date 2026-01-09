---
description: Forbid duplicate .on calls on Stores
---

# effector/no-duplicate-on

Disallow duplicate `.on`-handlers on a particular `Store`.

```ts
const increment = createEvent()

// 👎 which handler should we choose?
// it's better to remove one of them to remove ambiguity
const $badCounter = createStore(0)
  .on(increment, (counter) => counter + 1)
  .on(increment, (counter) => counter + 2)

// 👍 one handler - all is clear and explicit
const $goodCounter = createStore(0).on(increment, (counter) => counter + 1)
```
