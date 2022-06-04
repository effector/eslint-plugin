import React from "react";

import { mounted } from "./model";

const Button: React.FC = () => {
  React.useEffect(mounted, []);

  return <button>click</button>;
};

export { Button };
