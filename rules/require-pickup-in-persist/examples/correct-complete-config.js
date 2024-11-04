import { createStore, createEvent } from "effector";

import { persist } from "effector-storage/local";

const $store = createStore("example");
const updated = createEvent();

const appStarted = createEvent();

persist({
  source: $store.updates,
  target: updated,

  pickup: appStarted,

  key: "store",
  keyPrefix: "local",
});
