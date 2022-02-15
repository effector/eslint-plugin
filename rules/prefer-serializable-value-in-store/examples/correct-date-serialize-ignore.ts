import { createStore } from "effector";

export const $date = createStore(new Date(), { serialize: "ignore" });
