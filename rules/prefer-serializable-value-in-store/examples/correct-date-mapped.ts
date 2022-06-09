import { combine, createStore } from "effector";

const $dateString = createStore(new Date().toISOString());

export const $mapped = $dateString.map((s) => new Date(s));
export const $combined = combine($dateString, (s) => new Date(s));
