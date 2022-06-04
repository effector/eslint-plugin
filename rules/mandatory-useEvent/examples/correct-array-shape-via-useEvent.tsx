import React from "react";
import { useEvent } from "effector-react";
import { createEvent, createEffect } from "effector";

const clicked = createEvent();
const mounted = createEvent();
const unmounted = createEvent();
const fetchFx = createEffect(() => {});

const Button: React.FC = () => {
  const [clickedEvent, mountedEvent, unmountedEvent, fetch] = useEvent([
    clicked,
    mounted,
    unmounted,
    fetchFx,
  ]);

  React.useEffect(() => {
    mountedEvent();
    fetch();

    return () => {
      unmountedEvent();
    };
  }, []);

  return <button onClick={() => clickedEvent()}>click</button>;
};

export { Button };
