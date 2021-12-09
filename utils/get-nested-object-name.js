function getNestedObjectName(node) {
  let root = node;
  let name = "";

  while (root.type === "MemberExpression") {
    name = `${root.property.name}.${name}`;
    root = root.object;
  }

  if (root.type === "Identifier") {
    name = `${root.name}.${name}`;
  }

  // Remove last dot
  return name.slice(0, -1);
}

module.exports = { getNestedObjectName };
