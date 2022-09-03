import { createEvent, createStore } from "effector";

const add = createEvent();
const sub = createEvent();
const reset = createEvent();

const sum$ = createStore(0)
  .on(add, (s) => s + 1)
  .on(sub, (s) => s - 1)
  .reset(reset);

export { sum$ };
