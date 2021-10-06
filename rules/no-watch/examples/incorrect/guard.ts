import { createEvent, guard } from "effector";

const watcher = <T>(x: T) => x;
const myEvent = createEvent();

guard({
  clock: myEvent,
  filter: () => Math.random() > 0.5,
}).watch(watcher);
