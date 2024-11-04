import { createStore, createEvent } from "effector";

import { persist } from "effector-storage";
import { local as localAdapter } from "effector-storage/local";

const $store = createStore("example");
const pickup = createEvent();

persist({ store: $store, pickup, adapter: localAdapter });
