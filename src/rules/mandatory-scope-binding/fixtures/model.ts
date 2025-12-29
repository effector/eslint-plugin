import { createEffect, createEvent } from "effector"

export const clicked = createEvent<unknown>()
export const fetchFx = createEffect(() => {})

export const $$ = { context: { outputs: { clicked } } }
