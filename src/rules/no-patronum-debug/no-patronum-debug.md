---
description: Disallow the use of patronum/debug
---

# effector/no-patronum-debug

This rule will help to catch the forgotten `debug` and will automatically delete these calls from code.

```js
// from
import { createStore, createEvent } from "effector"
import { debug } from "patronum"

const increment = createEvent()
const $counter = createStore(0).on(increment, (count) => count + 1)

debug($counter)
```

```js
// to
import { createStore, createEvent } from "effector"

const increment = createEvent()
const $counter = createStore(0).on(increment, (count) => count + 1)
```

`debug` are considered to be intended for debugging units from effector and therefore not suitable for sending to the client.
