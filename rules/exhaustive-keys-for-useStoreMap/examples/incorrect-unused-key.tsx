import { createStore } from "effector";
import { useStoreMap } from "effector-react";

const $someStore = createStore([]);

function Component3() {
  const idx = 1;
  const oth = 2;

  const data = useStoreMap({
    store: $someStore,
    fn: (data, [id]) => data[id] ?? null,
    keys: [idx, oth],
  });

  return <div>{data}</div>;
}
