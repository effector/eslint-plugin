import { createEffect } from "effector";

const watcher = <T>(x: T) => x;
const watchableFx = createEffect();

watchableFx.watch(watcher);
watchableFx.done.watch(watcher);
watchableFx.fail.watch(watcher);
watchableFx.doneData.watch(watcher);
watchableFx.failData.watch(watcher);
watchableFx.finally.watch(watcher);
