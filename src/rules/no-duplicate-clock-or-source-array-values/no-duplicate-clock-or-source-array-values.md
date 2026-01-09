---
description: Forbid duplicate units in clock/source arrays
---

# effector/no-duplicate-clock-or-source-array-values

This rule forbids duplicate units in the array form of `clock` or `source` for `sample` and `guard`.

Duplicate units in a `clock` array do not change runtime behavior and thus are almost always a mistake. This typically occurs due to copy-paste errors or during refactoring when dealing with many units with similar names.

While duplicates in a `source` array _do_ affect runtime behavior, this is still usually unintentional. This rule helps catch these errors automatically, making debugging easier and keeping your code clean.

```ts
import { sample, createEvent, createStore } from "effector"

const event = createEvent()
const other = createEvent()
const $store = createStore("value")

sample({
  // 👎 duplicated `event` in the clock array is redundant and likely a mistake
  clock: [
    event,
    other,
    event, // [!code --]
  ],
  source: $store,
  fn: (x) => x * 2,
  target: $store,
})

sample({
  // 👍 each unit in the clock array is unique, making the intent clear
  clock: [event, other], // [!code ++]
  source: $store,
  fn: (x) => x * 2,
  target: $store,
})
```
