import { sample, createEvent } from "effector";

const trigger = createEvent();

sample({ source: trigger, fn: Boolean });
