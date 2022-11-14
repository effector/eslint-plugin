# effector/no-watch

Method `.watch` leads to imperative code. Try replacing it with operator (`sample`) or use the `target` parameter of the operator.

> Caution! This rule only works on projects using TypeScript.

```ts
const myFx = createEffect();
const myEvent = createEvent();
const $awesome = createStore();

// 👍 good solutions
sample({
  clock: myFx.finally,
  target: myEvent,
});

sample({
  clock: myEvent,
  filter: Boolean,
  target: myFx,
});

sample({
  clock: $awesome.updates,
  fn: identity,
  target: myEvent,
});

// 👎 bad solutions
myFx.finally.watch(myEvent);

myEvent.watch((payload) => {
  if (Boolean(payload)) {
    myFx(payload);
  }
});

$awesome.updates.watch((data) => {
  myEvent(identity(data));
});
```
