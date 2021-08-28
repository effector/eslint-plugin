import { createEffect, attach as recreate } from "effector";

const justEffectFx = createEffect();

const attched = recreate({ effect: justEffectFx });

export { attched };
