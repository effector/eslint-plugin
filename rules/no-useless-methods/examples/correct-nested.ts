import { createEvent, createStore, guard, sample } from "effector";

const emailValidationFired = createEvent();
const $isEmailFromGuestiaExist = createStore(false);
const $email = createStore("");
const $emailError = createStore(false);

sample({
  clock: guard({
    clock: emailValidationFired,
    source: $isEmailFromGuestiaExist,
    filter: (isExist) => !isExist,
  }),
  source: $email,
  fn: Boolean,
  target: $emailError,
});
