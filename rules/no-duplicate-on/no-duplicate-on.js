const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { isStoreNameValid } = require("../../utils/is-store-name-valid");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids duplicate `.on` calls on store",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-duplicate-on"),
    },
    messages: {
      dupplicateOn:
        "Method `.on` is called on store `{{ storeName }}` more than once for {{ unitName }}.",
    },
    schema: [],
  },
  create(context) {
    return {};
  },
};
