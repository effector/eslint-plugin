import { createEvent, createStore } from "effector";

const event = createEvent();
const event2 = createEvent();

const $store = createStore(null)
  .on(event, (_, s) => s)
  .on(event2, (_, s) => s)
  .on(event, (_, s) => s);
