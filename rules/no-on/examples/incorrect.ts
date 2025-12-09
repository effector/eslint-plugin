import { createEvent, createStore } from "effector";

const event = createEvent();

const $store = createStore(null).on(event, (_, s) => s);
