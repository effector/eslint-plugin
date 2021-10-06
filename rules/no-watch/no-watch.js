const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

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
        "Method `.watch` leads to imperative code. Try to replace it with operators (`sample`, `guard`, etc) or use the `target` parameter of the operators.",
    },
    schema: [],
  },
  create(context) {
    const { parserServices } = context;
    if (!parserServices.hasFullTypeInformation) {
      // JavaScript-way https://github.com/effector/eslint-plugin/issues/48#issuecomment-931107829
      return {};
    }
    const checker = parserServices.program.getTypeChecker();

    return {
      CallExpression(node) {
        const methodName = node.callee?.property?.name;
        if (methodName !== "watch") {
          return;
        }

        const object = traverseNestedObjectNode(node.callee?.object);
        const originalNode = parserServices.esTreeNodeToTSNodeMap.get(object);
        const type = checker.getTypeAtLocation(originalNode);

        const isEffectorUnit =
          ["Effect", "Event", "Store"].includes(type?.symbol?.escapedName) &&
          type?.symbol?.parent?.escapedName?.includes("effector");

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
