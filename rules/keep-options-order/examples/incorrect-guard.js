import { createEvent, createStore, guard } from "effector";

const clock = createEvent();
const source = createEvent();
const filter = createStore();
const target = createEvent();

guard({ filter, clock, source, target });
