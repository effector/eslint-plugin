import { createStore } from "effector";
import { debug } from "patronum";
const $store = createStore({ fullname: "John Due" });
debug($store);
