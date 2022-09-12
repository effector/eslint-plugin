import { createStore } from "effector";

function createStoreEx(initial) {
  return createStore(initial instanceof Function ? initial() : initial);
}

export { createStoreEx };
