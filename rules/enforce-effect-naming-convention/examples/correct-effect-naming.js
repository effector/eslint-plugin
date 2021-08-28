import { createEffect, attach } from "effector";

// Just createEffect
const baseEffectFx = createEffect();

// Attcch
const attachedFx = attach({ effect: baseEffectFx });

export { baseEffectFx, attachedFx };
