import React from "react";

import { unmounted } from "./model";

const Button: React.FC = () => {
  React.useEffect(() => {
    return () => unmounted();
  }, []);

  return <button>click</button>;
};

export { Button };
