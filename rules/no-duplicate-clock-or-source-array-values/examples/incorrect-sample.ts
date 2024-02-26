import { createEvent, createStore, sample } from "effector";
import { createEffect } from "effector";

const currentOrderUpdated = createEvent();

const setUnloadDeliveryDateFx = createEffect();

const $$order = {
  setUnloadDeliveryDateFx,
};

const $store = createStore(null);
const clickOnBtn = createEvent();

sample({
  source: [$store, $store],
  clock: [
    setUnloadDeliveryDateFx.doneData,
    $$order.setUnloadDeliveryDateFx.doneData,
    setUnloadDeliveryDateFx.doneData,
  ],
  filter: Boolean,
  target: currentOrderUpdated,
});
