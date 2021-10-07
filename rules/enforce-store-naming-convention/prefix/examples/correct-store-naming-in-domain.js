import { createDomain } from "effector";

const domain = createDomain();

const $storeOne = domain.createStore(null);
const $storeTwo = domain.store(null);

export { $storeOne, $storeTwo };
