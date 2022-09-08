import { createDomain } from "effector";

const d = createDomain();

const add = d.createEvent();
const sub = d.createEvent();
const reset = d.createEvent();

const sum$ = d
  .createStore(0)
  .on(add, (s) => s + 1)
  .on(sub, (s) => s - 1)
  .reset(reset);

export { sum$ };
