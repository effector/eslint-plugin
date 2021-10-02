import { createEvent } from "effector";

const watcher = <T>(x: T) => x;
const watchableEvent = createEvent();

watchableEvent.watch(watcher);
