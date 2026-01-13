---
description: Require every persist call of effector-storage to use pickup
---

# effector/require-pickup-in-persist

Requires every `persist` call of the [`effector-storage`](https://github.com/yumauri/effector-storage) library to include a `pickup` event when using [`Scope`s](https://effector.dev/api/effector/scope/). This ensures the correct initial value is loaded into the store for each `Scope`.

```ts
import { persist } from "effector-storage/query"

const $store = createStore("example")

// 👎 no pickup, does not work with Scope
persist({ store: $store })
```

```ts
const pickup = createEvent()

// 👍 pickup is specified
persist({ store: $store, pickup })
```
