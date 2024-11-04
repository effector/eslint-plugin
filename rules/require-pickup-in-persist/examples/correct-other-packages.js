import { createStore } from "effector";

import { persist } from "other-persist";
import { persist as persistNested } from "other-persist/nested";

const $store = createStore("example");

persist({ store: $store });
persistNested({ store: $store });
