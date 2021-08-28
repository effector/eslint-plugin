import { createDomain } from "effector";

const service = createDomain();

const effectOneFx = service.createEffect();
const effectTwoFx = service.effect();

export { effectOneFx, effectTwoFx };
