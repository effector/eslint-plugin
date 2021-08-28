import { createEffect, attach } from "effector";

const justEffectFx = createEffect();

const attched = attach({ effect: justEffectFx });

export { attched };
