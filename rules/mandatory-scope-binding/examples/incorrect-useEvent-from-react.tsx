import React, { useEvent } from "react";

import { clicked } from "./model";

const Button: React.FC = () => {
  const clickedEvent = useEvent(clicked);

  return <button onClick={clickedEvent}>click</button>;
};

export { Button };
