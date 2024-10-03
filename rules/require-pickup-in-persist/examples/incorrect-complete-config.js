import { createStore, createEvent } from "effector";

import { persist } from "effector-storage/local";

const $store = createStore("example");
const updated = createEvent();

persist({
  source: $store,
  target: updated,

  key: "store",
  keyPrefix: "local",
});
