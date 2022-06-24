import React from "react";

import { clicked } from "./model";

const Button: React.FC = () => {
  return <button onClick={() => clicked(null)}>click</button>;
};

export { Button };
