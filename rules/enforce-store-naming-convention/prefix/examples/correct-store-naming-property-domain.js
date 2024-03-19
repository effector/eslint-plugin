import { createDomain } from "effector";
import { attach, createEffect } from "effector";

const domain = createDomain();
const effect = createEffect();

const storeFx = attach({
  source: domain.store(0),
  effect,
});

const createStoreFx = attach({
  source: domain.createStore(0),
  effect,
});

export { storeFx, createDomain };
