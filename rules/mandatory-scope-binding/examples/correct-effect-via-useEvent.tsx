import React from "react";
import { useEvent } from "effector-react";

import { fetchFx } from "./model";

const Button: React.FC = () => {
  const clickedEffect = useEvent(fetchFx);

  return <button onClick={clickedEffect}>click</button>;
};

export { Button };
