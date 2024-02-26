import { createEvent, createStore, sample } from "effector";
import { createEffect } from "effector";

const currentOrderUpdated = createEvent();

const setUnloadDeliveryDateFx = createEffect();
const setLoadDeliveryDateFx = createEffect();

const $store = createStore(null);
const clickOnBtn = createEvent();

sample({
  clock: [
    setUnloadDeliveryDateFx.doneData,
    setLoadDeliveryDateFx,
    $store,
    clickOnBtn,
  ],
  filter: Boolean,
  target: currentOrderUpdated,
});
