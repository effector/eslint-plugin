function traverseNestedObjectNode(node) {
  if (node.type === "MemberExpression") {
    return traverseNestedObjectNode(node.property);
  }

  return node;
}

module.exports = { traverseNestedObjectNode };
