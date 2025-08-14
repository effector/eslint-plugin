function traverseRealDeclaration(node) {
  if (node?.id?.type === "ArrayPattern") {
    return node.id.elements;
  }

  return [node];
}

module.exports = { traverseRealDeclaration };
