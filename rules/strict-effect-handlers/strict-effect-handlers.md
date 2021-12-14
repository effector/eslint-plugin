# effector/strict-effect-handlers

[Related documentation](https://effector.dev/docs/api/effector/scope#imperative-effects-calls-with-scope)

When effect calls another effects then it should call only effects, not common async functions and effect calls should have await:

```ts
// 👍 effect without inner effects:
const delayFx = createEffect(async () => {
  await new Promise((rs) => setTimeout(rs, 80));
});
```

```ts
const authUserFx = createEffect();
const sendMessageFx = createEffect();

// 👍 effect with inner effects
const sendWithAuthFx = createEffect(async () => {
  await authUserFx();
  await delayFx();
  await sendMessageFx();
});
```

```ts
// 👎 effect with inner effects and common async functions

const sendWithAuthFx = createEffect(async () => {
  await authUserFx();
  //WRONG! wrap that in effect
  await new Promise((rs) => setTimeout(rs, 80));
  //context lost
  await sendMessageFx();
});
```

So, any effect might either call another effects or perform some async computations but not both.
