import { createStore } from "effector";

const service = { prefix: { body: { store: createStore(null) } } };

const value = service.prefix.body.store.getState();

export { value };
