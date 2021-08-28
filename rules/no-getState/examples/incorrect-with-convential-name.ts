import { createStore } from "effector";

const $data = createStore(null);

const value = $data.getState();

export { value };
