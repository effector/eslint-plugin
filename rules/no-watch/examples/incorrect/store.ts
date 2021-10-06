import { createStore } from "effector";

const watcher = <T>(x: T) => x;
const $watchable = createStore(0);

$watchable.watch(watcher);
$watchable.updates.watch(watcher);
