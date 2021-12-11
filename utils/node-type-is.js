function hasEffectorType({ node, possibleTypes, context }) {
  const checker = context.parserServices.program.getTypeChecker();
  const originalNode = context.parserServices.esTreeNodeToTSNodeMap.get(node);
  const type = checker.getTypeAtLocation(
    originalNode?.initializer ?? originalNode
  );

  return (
    possibleTypes.includes(type?.symbol?.escapedName) &&
    type?.symbol?.parent?.escapedName?.includes("effector")
  );
}

const nodeTypeIs = {
  effect: (opts) => hasEffectorType({ ...opts, possibleTypes: ["Effect"] }),
  store: (opts) => hasEffectorType({ ...opts, possibleTypes: ["Store"] }),
  event: (opts) => hasEffectorType({ ...opts, possibleTypes: ["Event"] }),
  unit: (opts) =>
    hasEffectorType({ ...opts, possibleTypes: ["Effect", "Store", "Event"] }),
  not: {
    effect: (opts) => !hasEffectorType({ ...opts, possibleTypes: ["Effect"] }),
    store: (opts) => !hasEffectorType({ ...opts, possibleTypes: ["Store"] }),
    event: (opts) => !hasEffectorType({ ...opts, possibleTypes: ["Event"] }),
    unit: (opts) =>
      !hasEffectorType({
        ...opts,
        possibleTypes: ["Effect", "Store", "Event"],
      }),
  },
};

module.exports = {
  nodeTypeIs,
};
