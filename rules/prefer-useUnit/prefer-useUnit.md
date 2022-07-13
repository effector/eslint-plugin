# effector/prefer-useUnit

`useUnit` is a brand-new hook which allows you to bind stores, events, and effects to React render cycle.

It is preferable than `useStore`/`useEvents`:

- it enables store updates batching, which can significantly increase React performance
- it does not have name collision with future React `useEvent` internal hook
- it has more explicit naming, old `useEvent` accepts events and effect, so its name is a bit implicit, new `useUnit` accepts any unit

You can replace `useStore`/`useEvent` by `useUnit` as is or replace all old hooks with only one `useUnit`

```tsx
// 👎 old approach
function OldComponent() {
  const value = useStore($value);
  const eventFn = useEvent(event);
  const effectFn = useEvent(effectFx);

  return (
    <>
      <h1>{value}</h1>
      <button onClick={eventFn}>Call event</button>
      <button onClick={effectFn}>Call effect</button>
    </>
  );
}

// 👍 new approach
function NewComponent() {
  const [value, eventFn, effectFn] = useUnit($value, event, effectFx);

  return (
    <>
      <h1>{value}</h1>
      <button onClick={eventFn}>Call event</button>
      <button onClick={effectFn}>Call effect</button>
    </>
  );
}
```
