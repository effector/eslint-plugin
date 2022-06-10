function nodeIsType({ node }) {
  return node?.parent?.type === "TSTypeReference";
}

module.exports = { nodeIsType };
