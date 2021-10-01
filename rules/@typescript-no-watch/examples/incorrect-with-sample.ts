import { createEvent, sample } from "effector";

const watcher = <T>(x: T) => x;
const myEvent = createEvent();

sample({
  clock: myEvent,
  fn: () => true,
}).watch(watcher);
