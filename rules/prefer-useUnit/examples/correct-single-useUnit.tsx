import React from "react";

import { createEffect, createEvent, createStore } from "effector";
import { useUnit } from "effector-react";

const $store = createStore(null);
const event = createEvent();
const effectFx = createEffect();

function Component() {
  const [value, eventFn, effectFn] = useUnit($store, event, effectFx);

  return (
    <button onClick={() => eventFn()} onContextMenu={() => effectFn()}>
      {value}
    </button>
  );
}

export { Component };
