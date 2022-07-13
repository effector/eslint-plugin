import React from "react";

import { createStore } from "effector";
import { useStore } from "effector-react";

const $store = createStore(null);

function Component() {
  const value = useStore($store);

  return <button>{value}</button>;
}

export { Component };
