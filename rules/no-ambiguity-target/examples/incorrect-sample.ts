import { sample, createEvent } from "effector";

const trigger = createEvent();
const target = createEvent();

const result = sample({ clock: trigger, fn: Boolean, target });
