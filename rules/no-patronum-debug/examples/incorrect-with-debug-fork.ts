import { fork, createStore } from "effector";
import { debug } from "patronum";
const $count = createStore(0);
const scopeA = fork({ values: [[$count, 42]] });
const scopeB = fork({ values: [[$count, 1337]] });
debug.registerScope(scopeA, { name: "scope_42" });
