import { sample } from "effector";

// Examples were found in production code-base with false-poitive detection on 0.1.3
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/27

sample({
  source: { list: $currencyList, active: $currency },
  clock: activateNextCurrency,
  fn: ({ list, active }) => {
    const index = list.findIndex((v) => v === active);

    return list[index + 1] ?? list[0];
  },
  target: activateCurrency,
});
