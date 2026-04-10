import { createEffect, createEvent, createStore, sample } from "effector"

export function createModel() {
  const $store = createStore(0)
  const increment = createEvent()
  const fetchFx = createEffect(() => {})

  sample({ clock: increment, target: fetchFx })

  return { $store, increment, fetchFx }
}

export function createCounter(initial: number) {
  const $count = createStore(initial)
  const inc = createEvent()
  const dec = createEvent()

  $count.on(inc, (n) => n + 1).on(dec, (n) => n - 1)

  return { $count, inc, dec }
}

export function createDeepModel() {
  const $store = createStore(0)
  return { level1: { level2: { $store } } }
}

export function regularFunction() {
  return { foo: "bar" }
}
