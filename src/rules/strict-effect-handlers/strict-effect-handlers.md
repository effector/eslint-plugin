---
description: Forbid mixing calls to both regular async functions and Effects in the same function
---

# effector/strict-effect-handlers

[Related documentation](https://effector.dev/en/advanced/work-with-scope/#effect-calls-rules)

When `Effect` calls another `Effect`s, then it should only call `Effect`s, not common asynchronous functions. Mixing both can lead to losing Scope in Fork API.

```ts
// 👍 effect without inner effects:
const delayFx = createEffect(async () => {
  await new Promise((rs) => setTimeout(rs, 80))
})
```

```ts
const authUserFx = createEffect()
const sendMessageFx = createEffect()

// 👍 effect with inner effects
const sendWithAuthFx = createEffect(async () => {
  await authUserFx()
  await delayFx()
  await sendMessageFx()
})
```

```ts
// 👎 effect with inner effects and common async functions

const sendWithAuthFx = createEffect(async () => {
  await authUserFx()
  //WRONG! wrap that in effect
  await new Promise((rs) => setTimeout(rs, 80))
  //context lost
  await sendMessageFx()
})
```

So, any effect might either call another effects or perform some asynchronous computations but not both.
