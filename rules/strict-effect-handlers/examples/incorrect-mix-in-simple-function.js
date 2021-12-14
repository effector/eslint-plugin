import { createEffect } from "effector";

async function f1() {}
const oneFx = createEffect();

async function justFunc() {
  await f1();
  await oneFx();
}

export { justFunc };
