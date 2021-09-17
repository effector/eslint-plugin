const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { isStoreNameValid } = require("../../utils/is-store-name-valid");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids `.getState` calls on any Effector store",
      category: "Quality",
      recommended: true,
    },
    messages: {
      abusiveCall:
        "Method `.getState` called on store `{{ storeName }}` can lead to race conditions. Replace it with `sample` or `guard`.",
    },
    schema: [],
  },
  create(context) {
    const { parserServices, settings } = context;

    const storeNameConvention = settings.effector?.storeNameConvention || "prefix";

    return {
      CallExpression(node) {
        const methodName = node.callee?.property?.name;
        if (methodName !== "getState") {
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

          const isEffectorStore =
            type?.symbol?.escapedName === "Store" &&
            type?.symbol?.parent?.escapedName?.includes("effector");

          if (!isEffectorStore) {
            return;
          }

          reportGetStateCall({ context, node, storeName: objectName });
        }
        // JavaScript-way
        else {
          const isEffectorStore = isStoreNameValid(objectName, storeNameConvention);
          if (!isEffectorStore) {
            return;
          }

          reportGetStateCall({ context, node, storeName: objectName });
        }
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
