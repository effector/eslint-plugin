import { sample, guard, createStore, createEvent } from "effector";

const $name = createStore("");
const $shouldSyncRealName = createStore(false);
const $nameValue = createStore("");

const nameInputChanged = createEvent();

// Examples were found in production code-base with false-poitive detection on 0.4.1
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/74

$nameValue.on(
  guard({
    clock: $name,
    filter: $shouldSyncRealName,
  }),
  (prev, newRealName) => newRealName
);

sample($nameInput, nameInputChanged).watch(console.log);
