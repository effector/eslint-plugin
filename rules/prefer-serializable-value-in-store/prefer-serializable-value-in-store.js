const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Avoid unserializable values in serializable stores",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("prefer-serializable-value-in-store"),
    },
    messages: {
      dangerousType: "Type {{typeName}} cannot be serialized.",
    },
    schema: [],
  },
  create(context) {},
};
