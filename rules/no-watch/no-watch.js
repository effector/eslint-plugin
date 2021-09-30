const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Avoid `.watch` calls on any Effector unit",
      category: "Quality",
      recommended: true,
    },
    messages: {
      // fixme: add js test
      // fixme: try to avoid watch always error on js files
      abusiveCall:
        "Method `.watch` leads to imperative code. Try to replace it with operators (`sample`, `guard`, etc).",
    },
    schema: [],
  },
  create(context) {
    const { parserServices } = context;

    return {
      CallExpression(node) {
        const methodName = node.callee?.property?.name;
        if (methodName !== "watch") {
          return;
        }

        const object = traverseNestedObjectNode(node.callee?.object);
        const objectName = object?.name;

        if (!objectName) {
          return;
        }

        // TypeScript-way
        if (parserServices.hasFullTypeInformation) {
          const checker = parserServices.program.getTypeChecker();
          const originalNode = parserServices.esTreeNodeToTSNodeMap.get(object);
          const type = checker.getTypeAtLocation(originalNode);

          const isEffectorUnit =
            ["Effect", "Event", "Store"].includes(type?.symbol?.escapedName) &&
            type?.symbol?.parent?.escapedName?.includes("effector");

          if (!isEffectorUnit) {
            return;
          }

          reportGetStateCall({ context, node });
        }
        // JavaScript-way
        else {
          reportGetStateCall({ context, node });
        }
      },
    };
  },
};

function reportGetStateCall({ context, node }) {
  context.report({
    node,
    messageId: "abusiveCall",
  });
}
