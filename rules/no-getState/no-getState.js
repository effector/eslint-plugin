const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { isStoreNameValid } = require("../../utils/is-store-name-valid");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { hasEffectorType } = require("../../utils/has-effector-type");

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
    const { parserServices } = context;

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
          const isEffectorStore = hasEffectorType({
            node: object,
            context,
            typeNames: ["Store"],
            useInitializer: false,
          });

          if (!isEffectorStore) {
            return;
          }

          reportGetStateCall({ context, node, storeName: objectName });
        }
        // JavaScript-way
        else {
          const isEffectorStore = isStoreNameValid(objectName, context);
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
