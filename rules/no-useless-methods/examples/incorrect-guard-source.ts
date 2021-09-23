import { guard, createEvent } from "effector";

const trigger = createEvent();

guard({ source: trigger, filter: Boolean });
