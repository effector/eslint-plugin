import { combine, createStore } from "effector";

const $store = createStore(null);

function createCustomStore(store) {
  return [store];
}

const [$justStore] = createCustomStore(combine({ store: $store }));

export { $justStore };
