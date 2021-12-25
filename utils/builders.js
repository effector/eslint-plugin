function buildObjectFromPropertiesInText({ properties, context }) {
  const content = properties
    .map((property) => context.getSourceCode().getText(property))
    .join(", ");

  return `{ ${content} }`;
}

function buildObjectFromMapInText({ map, context }) {
  const content = Object.entries(map)
    .filter(([_, node]) => Boolean(node))
    .map(([key, node]) => `${key}: ${context.getSourceCode().getText(node)}`)
    .join(", ");

  return `{ ${content} }`;
}

module.exports = { buildObjectFromPropertiesInText, buildObjectFromMapInText };
