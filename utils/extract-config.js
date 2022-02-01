function extractConfig(fields, { node }) {
  const config = {};

  fields.forEach((field) => {
    config[field] = node.arguments?.[0]?.properties.find(
      (n) => n.key?.name === field
    );
  });

  return config;
}

module.exports = { extractConfig };
