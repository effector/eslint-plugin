import { createEvent, createStore, guard } from "effector";
import { createEffect } from "effector";

const currentOrderUpdated = createEvent();

const setUnloadDeliveryDateFx = createEffect();

const $$order = {
  setUnloadDeliveryDateFx,
};

const $store = createStore(null);
const clickOnBtn = createEvent();

guard({
  source: [$store],
  clock: [
    setUnloadDeliveryDateFx.doneData,
    $$order.setUnloadDeliveryDateFx.doneData,
    clickOnBtn,
    setUnloadDeliveryDateFx.doneData,
    clickOnBtn,
  ],
  filter: Boolean,
  target: currentOrderUpdated,
});
