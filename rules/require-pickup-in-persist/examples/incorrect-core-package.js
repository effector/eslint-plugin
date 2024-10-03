import { createStore } from "effector";

import { persist } from "effector-storage";

const $store = createStore("example");

persist({ store: $store, adapter: localAdapter });
