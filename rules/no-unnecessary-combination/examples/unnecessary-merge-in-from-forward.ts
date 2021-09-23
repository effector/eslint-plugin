import { createEvent, forward, merge } from "effector";

const event1 = createEvent();
const event2 = createEvent();

const target = createEvent();

forward({ from: merge([event1, event2]), to: target });
