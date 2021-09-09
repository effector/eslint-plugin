import { createDomain } from "effector";

const service = createDomain();

const justStore = service.createStore(null);

export { justStore };
