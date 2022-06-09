import { createStore } from "effector";

export const $string = createStore("");
export const $stringOrNull = createStore<string | null>(null);

export const $number = createStore(0);
export const $numberOrNull = createStore<number | null>(null);

export const $boolean = createStore(false);
export const $booleanOrNull = createStore<boolean | null>(null);
