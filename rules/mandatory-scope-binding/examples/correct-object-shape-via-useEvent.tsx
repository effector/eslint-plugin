import React from "react";
import { useEvent } from "effector-react";

import { clicked, mounted, fetchFx, unmounted } from "./model";

const Button: React.FC = () => {
  const { clickedEvent, mountedEvent, unmountedEvent, fetch } = useEvent({
    clickedEvent: clicked,
    mountedEvent: mounted,
    unmountedEvent: unmounted,
    fetch: fetchFx,
  });

  React.useEffect(() => {
    mountedEvent();
    fetch();

    return () => {
      unmountedEvent();
    };
  }, []);

  return <button onClick={() => clickedEvent(true)}>click</button>;
};

export { Button };
