import { createStore, createEvent } from "effector";

const inc = createEvent();
const counterStore = createStore(0)
  .on(inc, (state) => state + 1)
  .on(inc, (state) => state + 2);

export { counterStore };
