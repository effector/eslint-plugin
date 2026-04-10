import { createEvent, createStore } from "effector"
import { modelFactory } from "effector-factorio"

export const counterFactory = modelFactory(() => {
  const $count = createStore(0)
  const inc = createEvent()
  const dec = createEvent()

  $count.on(inc, (n) => n + 1).on(dec, (n) => n - 1)

  return { $count, inc, dec }
})
