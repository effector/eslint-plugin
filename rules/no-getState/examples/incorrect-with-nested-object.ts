import { createStore } from "effector";

const service = { store: createStore(null) };

const value = service.store.getState();

export { value };
