# effector/no-watch

Method `.watch` leads to imperative code. Try to replace it with operators (`forward`, `sample`, etc).

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
$awesome.updates.watch(myEvent)
```