// Examples were found in production code-base with false-positive detection on 0.5.2
// https://github.com/effector/eslint-plugin/issues/85

import { createEvent, createStore } from "effector";

const $first = createStore("");
const $second = createStore("");

const change = createEvent();

const service = {
  inputs: { $first, $second },
};

service.inputs.$first.on(change, () => "HI");
service.inputs.$second.on(change, () => "BYE");

export { service };
