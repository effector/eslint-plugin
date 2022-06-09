function extractType({ node, context }) {
  try {
    const checker = context.parserServices.program.getTypeChecker();
    const originalNode = context.parserServices.esTreeNodeToTSNodeMap.get(node);
    const type = checker.getTypeAtLocation(
      originalNode?.initializer ?? originalNode
    );

    return type;
  } catch (e) {
    return null;
  }
}

module.exports = {
  extractType,
};
