import { createStore } from "effector";

const randomStore = createStore(null);

const value = randomStore.getState();

export { value };
