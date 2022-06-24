import React from "react";

import { createEvent } from "effector";
import { useEvent } from "effector-react";

const event = createEvent();

function Component() {
  const eventFn = useEvent(event);

  return <button onClick={() => eventFn()}>click</button>;
}

export { Component };
