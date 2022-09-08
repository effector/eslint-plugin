const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { nodeTypeIs } = require("../../utils/node-type-is");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Avoid `.watch` calls on any Effector unit or operator",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-watch"),
    },
    messages: {
      abusiveCall:
        "Method `.watch` leads to imperative code. Try to replace it with operator (`sample`) or use the `target` parameter of the operator.",
    },
    schema: [],
  },
  create(context) {
    const { parserServices } = context;
    if (!parserServices.hasFullTypeInformation) {
      // JavaScript-way https://github.com/effector/eslint-plugin/issues/48#issuecomment-931107829
      return {};
    }

    return {
      'CallExpression[callee.property.name="watch"]'(node) {
        const object = traverseNestedObjectNode(node.callee?.object);

        const isEffectorUnit = nodeTypeIs.unit({
          node: object,
          context,
        });

        if (!isEffectorUnit) {
          return;
        }

        reportWatchCall({ context, node });
      },
    };
  },
};

function reportWatchCall({ context, node }) {
  context.report({
    node,
    messageId: "abusiveCall",
  });
}
