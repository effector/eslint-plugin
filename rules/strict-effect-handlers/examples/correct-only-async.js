import { createEffect } from "effector";

async function f1() {}
async function f2() {}

const finalFx = createEffect(async () => {
  await f1();
  await f2();
});

export { finalFx };
