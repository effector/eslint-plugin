import { combine, createEvent, createStore, forward } from "effector";

const $store1 = createStore(null);
const $store2 = createStore(null);

const target = createEvent();

forward({ from: combine($store1, $store2), to: target });
