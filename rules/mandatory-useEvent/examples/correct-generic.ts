import { Effect, fork } from "effector";

export function CreateController() {
  abstract class SomeController {
    private async handleHttp() {
      const scope = fork({ handlers: new Map<Effect<any, any, any>, any>([]) });
    }
  }

  return SomeController;
}
