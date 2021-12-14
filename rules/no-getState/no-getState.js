const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { is } = require("../../utils/is");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids `.getState` calls on any Effector store",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-getState"),
    },
    messages: {
      abusiveCall:
        "Method `.getState` called on store `{{ storeName }}` can lead to race conditions. Replace it with `sample` or `guard`.",
    },
    schema: [],
  },
  create(context) {
    return {
      'CallExpression[callee.property.name="getState"]'(node) {
        const storeNode = traverseNestedObjectNode(node.callee?.object);

        const isEffectorStore = is.store({
          context,
          node: storeNode,
        });

        if (!isEffectorStore) {
          return;
        }

        reportGetStateCall({ context, node, storeName: storeNode.name });
      },
    };
  },
};

function reportGetStateCall({ context, node, storeName }) {
  context.report({
    node,
    messageId: "abusiveCall",
    data: {
      storeName,
    },
  });
}
