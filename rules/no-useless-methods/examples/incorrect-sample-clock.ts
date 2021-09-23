import { sample, createEvent } from "effector";

const trigger = createEvent();

sample({ clock: trigger, fn: Boolean });
