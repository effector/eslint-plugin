function extractConfig(fields, { node }) {
  const config = {};

  if (isObject(node.arguments?.[0])) {
    extractConfigFromObject(config, fields, node.arguments?.[0]);
  } else if (isObject(node.arguments?.[1])) {
    extractConfigFromObject(config, fields, node.arguments?.[1]);
    if (fields.includes("clock")) {
      config.clock = { value: node.arguments?.[0] };
    }
  }

  return config;
}

function isObject(node) {
  return Boolean(node?.properties);
}

function extractConfigFromObject(config, fields, node) {
  fields.forEach((field) => {
    config[field] = node?.properties?.find((n) => n.key?.name === field);
  });
}

module.exports = { extractConfig };
