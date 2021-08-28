import { createEffect, attach } from "effector";

// Just createEffect
const baseEffectFx = createEffect();

// Attcch
const attachedFx = attach({ effect: baseEffectFx });

// Factory
function createCustomEffect() {
  return createEffect();
}

const customFx = createCustomEffect();

export { baseEffectFx, attachedFx, customFx };
