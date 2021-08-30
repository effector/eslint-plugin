// Examples were found in production code-base with false-poitive detection on 0.1.2

forward({
  from: createTransactionFx.doneData.map((t) => [t]),
  to: addTransactions,
});
