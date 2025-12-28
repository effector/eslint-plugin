import { attach, createEffect } from "effector"

const baseFx = createEffect<void, void>()
const attachedFx = attach({ effect: baseFx })

export { attachedFx }
