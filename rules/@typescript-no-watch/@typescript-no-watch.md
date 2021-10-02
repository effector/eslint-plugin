# effector/@typescript-no-watch

Method `.watch` leads to imperative code. Try replacing it with operators (`forward`, `sample`, etc) or use the `target` parameter of the operators.

> Caution! This rule only works on projects using TypeScript.

```ts
const myFx = createEffect();
const myEvent = createEvent();

// 👍 good solution
forward({
  from: myFx,
  to: myEvent,
});
forward({
  from: myFx.done,
  to: myEvent,
});
forward({
  from: myFx.fail,
  to: myEvent,
});
forward({
  from: myFx.doneData,
  to: myEvent,
});
forward({
  from: myFx.failData,
  to: myEvent,
});
forward({
  from: myFx.finally,
  to: myEvent,
});

// 👎 bad solution
myFx.watch(myEvent);
myFx.done.watch(myEvent);
myFx.fail.watch(myEvent);
myFx.doneData.watch(myEvent);
myFx.failData.watch(myEvent);
myFx.finally.watch(myEvent);
```

```ts
const myFx = createEffect();
const myEvent = createEvent();

// 👍 good solution
forward({
  from: myEvent,
  to: myFx,
});

// 👎 bad solution
myEvent.watch(async () => {
  await myFx();
});
```

```ts
const $awesome = createStore();
const myEvent = createEvent();

// 👍 good solution
forward({
  from: $awesome.updates,
  to: myEvent,
});

// 👎 bad solution
$awesome.updates.watch(myEvent);
```

```ts
const myFx = createEffect();
const myEvent = createEvent();

// 👍 good solution
guard({
  clock: myEvent,
  filter: Boolean,
  target: myFx,
});

// 👎 bad solution
guard({
  clock: myEvent,
  filter: Boolean,
}).watch(myFx);
```

```ts
const myFx = createEffect();
const myEvent = createEvent();

// 👍 good solution
sample({
  clock: myEvent,
  fn: Identity,
  target: myFx,
});

// 👎 bad solution
sample({
  clock: myEvent,
  fn: Identity,
}).watch(myFx);
```
