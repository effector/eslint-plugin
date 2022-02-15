import { createStore } from "effector";

export const $dateOrNull = createStore<Date | null>(null);
