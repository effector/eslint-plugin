function hasEffectorType({ node, typeNames, context, useInitializer }) {
  const checker = context.parserServices.program.getTypeChecker();
  const originalNode = context.parserServices.esTreeNodeToTSNodeMap.get(node);
  const type = checker.getTypeAtLocation(
    useInitializer ? originalNode.initializer : originalNode
  );

  return (
    typeNames.includes(type?.symbol?.escapedName) &&
    type?.symbol?.parent?.escapedName?.includes("effector")
  );
}

module.exports = { hasEffectorType };
