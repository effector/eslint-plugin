function nodeName(node) {
  return node.id?.name ?? node.name;
}

module.exports = { nodeName };
