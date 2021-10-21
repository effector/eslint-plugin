import { createStore } from "effector";
import { useStoreMap } from "effector-react";

const $someStore = createStore([]);

function Component1() {
  const data = useStoreMap($someStore, (data) => data.length);

  return <div>{data}</div>;
}

function Component2() {
  const data = useStoreMap({
    store: $someStore,
    fn: (data) => data.length,
    keys: [],
  });

  return <div>{data}</div>;
}

function Component3() {
  const idx = 1;

  const data = useStoreMap({
    store: $someStore,
    fn: (data, [index]) => data[index] ?? null,
    keys: [idx],
  });

  return <div>{data}</div>;
}
