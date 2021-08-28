import { createStore } from "effector";

const $store = createStore<boolean | undefined>(false);

const service = { $store };

export { service };
