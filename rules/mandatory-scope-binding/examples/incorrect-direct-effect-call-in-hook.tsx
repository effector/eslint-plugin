import React from "react";

import { fetchFx } from "./model";

const Button: React.FC = () => {
  React.useEffect(() => {
    fetchFx();
  }, []);

  return <button>click</button>;
};

export { Button };
