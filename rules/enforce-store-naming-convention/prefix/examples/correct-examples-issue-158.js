import { createStore } from "effector";

const arrow = ({ store = createStore(0) }) => {
  return { store };
};

function declaration({ store = createStore(1) }) {
  return { store };
}

export { arrow, declaration };
