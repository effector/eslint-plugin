import { createEffect } from "effector";

const oneFx = createEffect();
const twoFx = createEffect();

const finalFx = createEffect(async () => {
  await oneFx();
  await twoFx();
});

export { finalFx };
