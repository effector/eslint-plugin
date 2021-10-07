function traverseParentByType(node, type, config) {
  const stopOnTypes = config?.stopOnTypes ?? [];

  if (!node || stopOnTypes.includes(node.type)) {
    return null;
  }

  if (node.type === type) {
    return node;
  }

  return traverseParentByType(node.parent, type, config);
}

module.exports = { traverseParentByType };
