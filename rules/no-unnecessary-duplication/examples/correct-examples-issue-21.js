import { guard } from "effector";

// Examples were found in production code-base with false-positive detection on 0.1.2
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/21

guard({
  source: someService.$aviaForm,
  clock: someService.submitted,
  filter: (state) =>
    Boolean(state && isValidDirection(state.origin, state.destination)),
  target: drawAttention,
});

guard({
  source: promocodeModel.$verifyError,
  clock: [promocodeChanged, promocodeInputBlurred],
  filter: Boolean,
  target: promocodeModel.verifyErrorReset,
});

guard({
  source: [someService.$aviaForm, $backendFilters, currencyService.$currency],
  clock: [$backendFilters, publicApi.allPricesShown],
  filter: $isValid,
  target: requestPricesFx,
});
