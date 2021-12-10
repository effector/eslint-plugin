function hasEffectorType({ node, possibleTypes, context, useInitializer }) {
  const checker = context.parserServices.program.getTypeChecker();
  const originalNode = context.parserServices.esTreeNodeToTSNodeMap.get(node);
  const type = checker.getTypeAtLocation(
    useInitializer ? originalNode.initializer : originalNode
  );

  return (
    possibleTypes.includes(type?.symbol?.escapedName) &&
    type?.symbol?.parent?.escapedName?.includes("effector")
  );
}

function variableHasEffectorType({ node, possibleTypes, context }) {
  return hasEffectorType({
    node,
    possibleTypes,
    context,
    useInitializer: true,
  });
}

function expressionHasEffectorType({ node, possibleTypes, context }) {
  return hasEffectorType({
    node,
    possibleTypes,
    context,
    useInitializer: false,
  });
}

module.exports = {
  variableHasEffectorType,
  expressionHasEffectorType,
};
