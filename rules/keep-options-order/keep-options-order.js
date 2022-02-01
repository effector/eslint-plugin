const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { buildObjectInText } = require("../../utils/builders");

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
      changeOrder: "Sort options",
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

          const configNode = node?.arguments?.[0];
          const optionsNodes = configNode?.properties;

          const optionsOrder = optionsNodes?.map((prop) => prop?.key.name);

          const idealOrder = filteredCorrectOrder(optionsOrder);

          if (isCorrectOrder(optionsOrder, idealOrder)) {
            continue;
          }

          context.report({
            node,
            messageId: "invalidOrder",
            data: {
              incorrectOrderTag: makeTag(optionsOrder),
            },
            suggest: [
              {
                messageId: "changeOrder",
                fix(fixer) {
                  const newConfig = buildObjectInText.fromArrayOfNodes({
                    properties: sortNodesByName(optionsNodes, idealOrder),
                    context,
                  });

                  return fixer.replaceText(configNode, newConfig);
                },
              },
            ],
          });
        }
      },
    };
  },
};

function makeTag(order) {
  return order.join("->");
}

function isCorrectOrder(checkOrder, idealOrder) {
  return idealOrder.every((refItem, index) => checkOrder?.[index] === refItem);
}

function filteredCorrectOrder(checkOrder) {
  return correctOrder.filter((item) => checkOrder?.includes(item));
}

function sortNodesByName(nodes, nameOrder) {
  const newNodes = [];

  for (const name of nameOrder) {
    const node = nodes.find((node) => node?.key.name === name);
    newNodes.push(node);
  }

  return newNodes;
}
