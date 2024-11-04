import { createStore, createEvent } from "effector";

import { persist as persistAsync } from "@effector-storage/react-native-async-storage";

const $store = createStore("example");
const pickup = createEvent();

persistAsync({ store: $store, pickup });
