import { createStore } from "effector";

function createCustomStore() {
  return createStore(null);
}

// Just createStore
const justStore = createCustomStore();

export { justStore };
