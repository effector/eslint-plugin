import { createStore } from "effector";
import { useStoreMap } from "effector-react";

const $someStore = createStore([]);

function Component3() {
  const idx = 1;

  const data = useStoreMap({
    store: $someStore,
    fn: (data) => data.length,
    keys: [idx],
  });

  return <div>{data}</div>;
}
