import { createEffect, createEvent } from "effector";

export const clicked = createEvent<unknown>();
export const mounted = createEvent();
export const unmounted = createEvent();
export const fetchFx = createEffect(() => {});
