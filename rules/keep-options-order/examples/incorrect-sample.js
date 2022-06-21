import { createEvent, createStore, sample } from "effector";

const clock = createEvent();
const source = createEvent();
const filter = createStore();
const fn = () => null;
const target = createEvent();

sample({ source, clock, filter, fn, greedy: true, target });
