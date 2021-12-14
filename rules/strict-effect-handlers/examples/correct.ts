import { createEffect } from "effector";

const oneFx = createEffect();
const twoFx = createEffect();

const onlyEffectsFx = createEffect(async () => {
  await oneFx(1);
  await twoFx(1);
});

async function f1() {}
async function f2() {}

const onlyFunctionsFx = createEffect(async () => {
  await f1();
  await f2();
});

async function justFunctionWithEffects() {
  await oneFx(1);
  await twoFx(1);
}

async function justFunctionWithFunctions() {
  await f1();
  await f2();
}

export {
  onlyEffectsFx,
  onlyFunctionsFx,
  justFunctionWithEffects,
  justFunctionWithFunctions,
};
