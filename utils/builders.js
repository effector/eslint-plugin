const buildObjectInText = {
  fromArrayOfNodes({ properties, context }) {
    const content = properties
      .map((property) => context.getSourceCode().getText(property))
      .join(", ");

    return `{ ${content} }`;
  },
  fromMapOfNodes({ properties, context }) {
    const content = Object.entries(properties)
      .filter(([_, node]) => Boolean(node))
      .map(([key, node]) => `${key}: ${context.getSourceCode().getText(node)}`)
      .join(", ");

    return `{ ${content} }`;
  },
};

module.exports = { buildObjectInText };
