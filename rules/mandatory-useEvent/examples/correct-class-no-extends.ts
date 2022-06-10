import { allSettled, createEffect, fork } from "effector";

const somethingHasppenedFx = createEffect();

export function CreateController() {
  class SomeController {
    private async handleHttp() {
      const scope = fork({ handlers: [[somethingHasppenedFx, () => null]] });

      await allSettled(somethingHasppenedFx, { scope, params: {} });
    }
  }

  return SomeController;
}
