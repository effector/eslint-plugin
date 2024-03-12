import { attach, combine, createStore, createEffect } from "effector";

const testFx = attach({
  source: createStore(0),
  effect: createEffect(),
});

const combineFx = attach({
  source: {
    value: combine(),
  },
  effect: createEffect(),
});

const createStoreFx = attach({
  source: {
    value: createStore(0),
  },
  effect: createEffect(),
});

export { testFx, combineFx, createStoreFx };
