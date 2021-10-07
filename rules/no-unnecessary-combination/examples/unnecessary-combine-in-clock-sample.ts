import { combine, createStore, sample } from "effector";

const $store1 = createStore(null);
const $store2 = createStore(null);

sample({ clock: combine($store1, $store2) });
