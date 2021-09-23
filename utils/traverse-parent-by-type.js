function traverseParentByType(node, type) {
  if (!node) {
    return null;
  }

  if (node.type === type) {
    return node;
  }

  return traverseParentByType(node.parent, type);
}

module.exports = { traverseParentByType };
