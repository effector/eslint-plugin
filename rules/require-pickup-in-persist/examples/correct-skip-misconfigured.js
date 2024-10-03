import { createStore } from "effector";

import { persist } from "effector-storage";

const randomCall = () => ({ store: createStore() });

persist();
persist("invalid");
persist(randomCall());
