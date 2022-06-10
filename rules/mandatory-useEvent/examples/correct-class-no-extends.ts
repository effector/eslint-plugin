import { allSettled, createEffect, fork } from "effector";

const somethingHasppenedFx = createEffect();

export function CreateController() {
  abstract class SomeController {
    private async handleHttp() {
      const scope = fork({ handlers: [[somethingHasppenedFx, () => null]] });

      await allSettled(somethingHasppenedFx, { scope, params: {} });
    }
  }

  return SomeController;
}
