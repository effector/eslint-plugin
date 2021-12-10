function hasEffectorType({ node, typeNames, context }) {
  const checker = context.parserServices.program.getTypeChecker();
  const originalNode = context.parserServices.esTreeNodeToTSNodeMap.get(node);
  const type = checker.getTypeAtLocation(originalNode.initializer);

  return (
    typeNames.includes(type?.symbol?.escapedName) &&
    type?.symbol?.parent?.escapedName?.includes("effector")
  );
}

module.exports = { hasEffectorType };
