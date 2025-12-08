import { createStore } from "effector";

function createCustomStore() {
  return [createStore(null)];
}

const [justStore] = createCustomStore();

export { justStore };
