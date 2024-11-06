# effector/no-on

This rule forbids `.on` chaining on effector store.

---

```ts
const event = createEvent()
// 👎 could be replaced
const $store = createStore(null).on(event, (_, s) => s)


const event = createEvent()
const $store = createStore(null)
// 👍 makes sense
sample({
    clock: event,
    target: $store
})
```
