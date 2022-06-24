import React from "react";
import { useEvent, useStore } from "effector-react";

import { fetchFx } from "./model";

const Button: React.FC = () => {
  const loading = useStore(fetchFx.pending);

  if (loading) {
    return null;
  }

  return <button>click</button>;
};

export { Button };
