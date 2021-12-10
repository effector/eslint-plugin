import { createEvent, createStore } from "effector";

function createFactory1() {
  const event = createEvent();

  const $store = createStore("").on(event, () => null);

  return { $store, event };
}

function createFactory2() {
  const event = createEvent();

  const $store = createStore("").on(event, () => "TEST");

  return { $store, event };
}

export { createFactory1, createFactory2 };
