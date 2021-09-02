const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");
const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `forward` with `.map`/`.prepend`",
      category: "Quality",
      recommended: true,
    },
    messages: {
      overMap:
        "Instead of `forward` with `{{ eventName }}.map` you can use `sample`",
      overPrepend:
        "Instead of `forward` with `{{ eventName }}.prepend` you can use `sample`",
    },
    schema: [],
  },
  create(context) {
    const importedFromEffector = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFromEffector(importedFromEffector, node);
      },
      CallExpression(node) {
        const localMethod = importedFromEffector.get("forward");
        if (!localMethod) {
          return;
        }

        const isEffectorMethod = node?.callee?.name === localMethod;
        if (!isEffectorMethod) {
          return;
        }

        const forwardConfig = {
          from: node.arguments?.[0]?.properties.find(
            (n) => n.key?.name === "from"
          ),
          to: node.arguments?.[0]?.properties.find((n) => n.key?.name === "to"),
        };

        if (!forwardConfig.from || !forwardConfig.to) {
          return;
        }

        function checkForMapping({ paramNode, methodName, messageId }) {
          if (paramNode.value?.type !== "CallExpression") {
            return;
          }

          if (paramNode.value?.callee?.property?.name !== methodName) {
            return;
          }

          const eventNode = traverseNestedObjectNode(
            paramNode.value?.callee?.object
          );
          const eventName = eventNode?.name;

          if (!eventName) {
            return;
          }

          // console.log(eventName);

          context.report({
            node,
            messageId,
            data: {
              eventName,
            },
          });
        }

        checkForMapping({
          paramNode: forwardConfig.from,
          methodName: "map",
          messageId: "overMap",
        });
        checkForMapping({
          paramNode: forwardConfig.to,
          methodName: "prepend",
          messageId: "overPrepend",
        });
      },
    };
  },
};
