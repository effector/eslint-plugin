import React from "react";

import { createEffect, createEvent, createStore } from "effector";
import { useUnit } from "effector-react";

const $store = createStore(null);
const event = createEvent();
const effectFx = createEffect();

function Component() {
  const value = useUnit($store);
  const eventFn = useUnit(event);
  const effectFn = useUnit(effectFx);

  return (
    <button onClick={() => eventFn()} onContextMenu={() => effectFn()}>
      {value}
    </button>
  );
}

export { Component };
