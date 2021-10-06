import { createEffect } from "effector";

const watcher = <T>(x: T) => x;
const watchableFx = createEffect();

watchableFx.done.watch(watcher);
watchableFx.doneData.watch(watcher);
