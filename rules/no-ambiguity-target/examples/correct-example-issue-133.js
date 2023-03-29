// Examples were found in production code-base with exception on 0.10.3
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/133

import { createStore, createEvent, sample } from "effector";

const obj = {
  fn: () => {
    const $store = createStore(0);
    const event = createEvent();
    // warning  Method `sample` returns `target` and assigns the result to a variable. Consider removing one of them  effector/no-ambiguity-target
    sample({
      source: event,
      target: $store,
    });
  },
};
