import { guard, createEvent } from "effector";

const trigger = createEvent();

guard({ clock: trigger, filter: Boolean });
