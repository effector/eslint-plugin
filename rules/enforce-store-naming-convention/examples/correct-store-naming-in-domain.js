import { createDomain } from "effector";

const d = createDomain();

const $sum = d.createStore(0);

export { $sum };
