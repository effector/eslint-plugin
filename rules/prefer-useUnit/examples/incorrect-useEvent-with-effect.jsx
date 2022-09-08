import React from "react";

import { createEffect } from "effector";
import { useEvent } from "effector-react";

const effectFx = createEffect();

function Component() {
  const effectFn = useEvent(effectFx);

  return <button onClick={() => effectFn()}>click</button>;
}

export { Component };
