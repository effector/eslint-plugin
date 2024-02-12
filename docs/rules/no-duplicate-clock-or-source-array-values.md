# effector/no-duplicate-clock-or-source-array-values

This rule forbids unit duplicates on `source` and `clock` with sample and guard methods.

```js
// from
import { createEvent, createStore, sample } from "effector";
import { createEffect } from "effector";

const currentOrderUpdated = createEvent();
const setUnloadDeliveryDateFx = createEffect();

const $store = createStore(null);

sample({
  clock: [
    setUnloadDeliveryDateFx.doneData,
    setUnloadDeliveryDateFx.doneData,
    $store,
  ],
  filter: Boolean,
  target: currentOrderUpdated,
});
```

---

```js
// to
import { createEvent, createStore, sample } from "effector";
import { createEffect } from "effector";

const currentOrderUpdated = createEvent();
const setUnloadDeliveryDateFx = createEffect();

const $store = createStore(null);

sample({
  clock: [
    setUnloadDeliveryDateFx.doneData, // dublicate removed
    $store,
  ],
  filter: Boolean,
  target: currentOrderUpdated,
});
```
