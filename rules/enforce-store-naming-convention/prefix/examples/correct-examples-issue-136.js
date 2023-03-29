// Examples were found in production code-base with exception on 0.10.3
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/136

import { combine, sample } from "effector";
import { modelFactory } from "effector-factorio";

export const factory = modelFactory(() => {
  sample({
    clock: combine([createStore("")]),
    fn: ([fieldType, customFieldId]) => customFieldId || fieldType,
    target: createStore(""),
  });

  return {};
});
