// Examples were found in production code-base with exception on 0.10.2
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/128

import { is, createStore } from "effector";

function toStore(value) {
  return is.store(value) ? value : createStore(value);
}
