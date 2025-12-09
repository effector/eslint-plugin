import { createEvent, createStore, sample } from "effector";

const event = createEvent();

const $store = createStore(null);

sample({
  clock: event,
  target: $store,
});
