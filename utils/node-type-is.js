function hasType({ node, possibleTypes, context, from }) {
  try {
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
  } catch (e) {
    return false;
  }
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
  effectorReactHook: (opts) =>
    hasType({
      ...opts,
      possibleTypes: opts.hook
        ? [].concat(opts.hook)
        : [
            "useStore",
            "useStoreMap",
            "useList",
            "useEvent",
            "useGate",
            "useUnit",
          ],
      from: "effector-react",
    }),
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
    effectorReactHook: (opts) => !nodeTypeIs.effectorReactHook(opts),
  },
};

module.exports = {
  nodeTypeIs,
};
