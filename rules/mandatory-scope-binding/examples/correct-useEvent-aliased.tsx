import React from "react";
import { useEvent as useEffectorEvent } from "effector-react";

import { clicked } from "./model";

const Button: React.FC = () => {
  const clickedEvent = useEffectorEvent(clicked);

  return <button onClick={clickedEvent}>click</button>;
};

export { Button };
