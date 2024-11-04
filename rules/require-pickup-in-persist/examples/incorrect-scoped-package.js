import { createStore, createEvent } from "effector";

import { persist as persistAsync } from "@effector-storage/react-native-async-storage";

const $store = createStore("example");

persistAsync({ store: $store });
