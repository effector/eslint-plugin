// Example was found in production code-base with false-positive.

import { createEvent, createStore } from "effector";

function createField() {
  return {
    $value: createStore(""),
  };
}

const change = createEvent<{ first: string; second: string }>();

const firstField = createField();
const secondField = createField();

firstField.$value.on(change, (_, { first }) => first);
secondField.$value.on(change, (_, { second }) => second);
