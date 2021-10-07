import { createStore } from "effector";

// Just createStore
const $justStore = createStore("");

// Map
const mappedStore = $justStore.map((values) => values.length);

export { mappedStore };
