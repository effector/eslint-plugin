function traverseNestedObjectNode(node) {
  if (node.type === "MemberExpression") {
    return traverseNestedObject(node.property);
  }

  return node;
}

module.exports = { traverseNestedObjectNode };
