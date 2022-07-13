import React from "react";
import * as effectorHooks from "effector-react";

import { clicked } from "./model";

const Button: React.FC = () => {
  const clickedEvent = effectorHooks.useEvent(clicked);

  return <button onClick={clickedEvent}>click</button>;
};

export { Button };
