function hasType({ node, possibleTypes, context, from }) {
  const checker = context.parserServices.program.getTypeChecker();
  const originalNode = context.parserServices.esTreeNodeToTSNodeMap.get(node);
  const type = checker.getTypeAtLocation(
    originalNode?.initializer ?? originalNode
  );

  const symbol = type?.symbol ?? type?.aliasSymbol;

  return (
    possibleTypes.includes(symbol?.escapedName) &&
    Boolean(symbol?.parent?.escapedName?.includes(from))
  );
}

const nodeTypeIs = {
  effect: (opts) =>
    hasType({ ...opts, possibleTypes: ["Effect"], from: "effector" }),
  store: (opts) =>
    hasType({ ...opts, possibleTypes: ["Store"], from: "effector" }),
  event: (opts) =>
    hasType({ ...opts, possibleTypes: ["Event"], from: "effector" }),
  unit: (opts) =>
    hasType({
      ...opts,
      possibleTypes: ["Effect", "Store", "Event"],
      from: "effector",
    }),
  gate: (opts) =>
    hasType({ ...opts, possibleTypes: ["Gate"], from: "effector-react" }),
  not: {
    effect: (opts) =>
      !hasType({
        ...opts,
        possibleTypes: ["Effect"],
        from: "effector",
      }),
    store: (opts) =>
      !hasType({ ...opts, possibleTypes: ["Store"], from: "effector" }),
    event: (opts) =>
      !hasType({ ...opts, possibleTypes: ["Event"], from: "effector" }),
    unit: (opts) =>
      !hasType({
        ...opts,
        possibleTypes: ["Effect", "Store", "Event"],
        from: "effector",
      }),
    gate: (opts) =>
      !hasType({ ...opts, possibleTypes: ["Gate"], from: "effector-react" }),
  },
};

module.exports = {
  nodeTypeIs,
};
