# effector/no-watch

Method `.watch` leads to imperative code. Try replacing it with operators (`forward`, `sample`, etc) or use the `target` parameter of the operators.

> Caution! This rule only works on projects using TypeScript.

```ts
const myFx = createEffect();
const myEvent = createEvent();
const $awesome = createStore();

// 👍 good solutions
forward({
  from: myFx.finally,
  to: myEvent,
});

guard({
  clock: myEvent,
  filter: Boolean,
  target: myFx,
});

sample({
  from: $awesome.updates,
  fn: identity,
  to: myEvent,
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
