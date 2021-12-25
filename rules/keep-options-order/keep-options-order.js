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
      invalidOrder: `Order of options should be ${makeTag(
        correctOrder
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

          const optionsNodes = node?.arguments?.[0]?.properties;

          const optionsOrder = optionsNodes?.map((prop) => prop?.key.name);

          const validOrder = isCorrectOrder(optionsOrder);
          if (validOrder) {
            continue;
          }

          context.report({
            node,
            messageId: "invalidOrder",
            data: {
              incorrectOrderTag: makeTag(optionsOrder),
            },
          });
        }
      },
    };
  },
};

function makeTag(order) {
  return order.join("->");
}

function isCorrectOrder(checkOrder) {
  const filteredCorrectOrder = correctOrder.filter((item) =>
    checkOrder?.includes(item)
  );

  return filteredCorrectOrder.every(
    (refItem, index) => checkOrder?.[index] === refItem
  );
}
