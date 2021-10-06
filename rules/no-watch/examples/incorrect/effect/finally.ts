import { createEffect } from "effector";

const watcher = <T>(x: T) => x;
const watchableFx = createEffect();

watchableFx.finally.watch(watcher);
