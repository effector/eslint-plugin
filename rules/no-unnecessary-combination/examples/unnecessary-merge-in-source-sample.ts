import { createEvent, merge, sample } from "effector";

const event1 = createEvent();
const event2 = createEvent();

sample({ source: merge([event1, event2]) });
