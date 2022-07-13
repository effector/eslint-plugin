import { Effect, fork } from "effector";

export function Component() {
  const scope = fork({ handlers: new Map<Effect<any, any, any>, any>([]) });

  type Somethind<T> = unknown;

  const t: Somethind<Array<Effect<any, any, any>>> = [] as any;

  return null;
}
