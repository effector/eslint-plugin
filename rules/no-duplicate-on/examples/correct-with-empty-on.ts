import { createEvent, createStore } from "effector";

const $store = createStore(1);

// Yeah, it's incorrect TS code, but it isn't this plugin's business
$store.on();
