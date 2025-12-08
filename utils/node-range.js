function nodeRange(node) {
  return node.id?.range ?? node.range;
}

module.exports = { nodeRange };
