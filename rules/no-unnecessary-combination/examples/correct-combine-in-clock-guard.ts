import { combine, createEvent, createStore, guard, merge } from "effector";

const $store1 = createStore(null);
const $store2 = createStore(null);

guard({ clock: combine($store1, $store2), filter: Boolean });
