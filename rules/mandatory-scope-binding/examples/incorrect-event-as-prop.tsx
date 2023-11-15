import React from "react";

import { clicked } from "./model";

const Button: React.FC = () => {
  return <button onClick={clicked}>click</button>;
};

export { Button };
