function buildObjectInText({ properties, context }) {
  const content = properties
    .map((property) => context.getSourceCode().getText(property))
    .join(", ");

  return `{ ${content} }`;
}

module.exports = { buildObjectInText };
