# Forbids `.getState` calls on any Effector store (`effector/no-getState`)

`.getState` gives rise to difficult to debug imperative code and kind of race condition. Prefer declarative `sample` to pass data from store and `attach` for effects.
