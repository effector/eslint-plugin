import { sample, guard, createStore, createEvent } from "effector";

const $name = createStore("");
const $shouldSyncRealName = createStore(false);
const $nameValue = createStore("");

const nameInputChanged = createEvent();

$nameValue.on(
  guard({
    clock: $name,
    filter: $shouldSyncRealName,
  }),
  (prev, newRealName) => newRealName
);

sample($nameInput, nameInputChanged).watch(console.log);
