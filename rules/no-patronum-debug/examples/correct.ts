import { createStore } from "effector";
const debug = (...args) => ({ ...args });
debug({ test: "debug" });
const $store = createStore({});
debug({ store: $store });
