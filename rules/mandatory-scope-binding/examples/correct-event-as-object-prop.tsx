import React from "react";
import { useEvent } from "effector-react";

import * as model from "./model";

const Button: React.FC = () => {
  const clickedEvent = useEvent(model.clicked);
  const mounted = useEvent(model.deepNestedModel.context.outputs.mounted);

  React.useEffect(mounted, []);

  return <button onClick={clickedEvent}>click</button>;
};

export { Button };
