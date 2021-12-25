const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

const { correctOrder } = require("./config");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce options order for Effector methods",
      category: "Style",
      recommended: true,
      url: createLinkToRule("keep-options-order"),
    },
    messages: {
      invalidOrder: `Order of options should be ${correctOrder.join(
        "->"
      )}, but found {{ incorrectOrderTag }}`,
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const importedFromEffector = new Map();
    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffector,
          node,
          packageName: "effector",
        });
      },
      CallExpression(node) {
        // Effect creation with method
        const OPTIONS_METHODS = ["sample", "guard"];
        for (const method of OPTIONS_METHODS) {
          const localMethod = importedFromEffector.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorMethods = node.callee.name === localMethod;
          if (!isEffectorMethods) {
            continue;
          }

          const invalidOrder = false;
          if (!invalidOrder) {
            continue;
          }

          context.report({
            node,
            messageId: "invalidOrder",
            data: {
              incorrectOrderTag: "UNKNOWN",
            },
          });
        }
      },
    };
  },
};
