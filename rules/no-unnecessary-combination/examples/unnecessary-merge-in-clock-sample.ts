import { createEvent, merge, sample } from "effector";

const event1 = createEvent();
const event2 = createEvent();

sample({ clock: merge([event1, event2]) });
