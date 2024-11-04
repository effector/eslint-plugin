import { createStore, createEvent } from "effector";

import { persist as persistQuery } from "effector-storage/query";

const $store = createStore("example");
const pickup = createEvent();

persistQuery({ store: $store, pickup });
