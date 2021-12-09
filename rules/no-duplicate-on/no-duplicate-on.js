const { isStoreNameValid } = require("../../utils/is-store-name-valid");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { getNestedObjectName } = require("../../utils/get-nested-object-name");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids duplicate `.on` calls on store",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-duplicate-on"),
    },
    messages: {
      duplicateOn:
        "Method `.on` is called on store `{{ storeName }}` more than once for {{ unitName }}.",
    },
    schema: [],
  },
  create(context) {
    const usedOns = new Map();

    function isEventUsedInStoreOn(storeName, unitName) {
      const usedUnits = usedOns.get(storeName);

      if (!usedUnits) {
        return false;
      }

      return usedUnits.has(unitName);
    }

    function markUnitAsUsedInStoreOn(storeName, unitNames) {
      let usedUnits = usedOns.get(storeName);

      if (!usedUnits) {
        usedUnits = new Set();
        usedOns.set(storeName, usedUnits);
      }

      usedUnits.add(...unitNames);
    }

    return {
      CallExpression(node) {
        const methodName = node.callee?.property?.name;
        if (methodName !== "on") {
          return;
        }

        const storeObject = getNestedCallee(node);
        const storeName = storeObject?.name;

        if (!storeName) {
          return;
        }

        const isEffectorStore = isStoreNameValid(storeName, context);
        if (!isEffectorStore) {
          return;
        }

        const triggerObjects = normalizePossibleArrayNode(node.arguments[0]);
        const unitNames = triggerObjects.map(getNestedObjectName);

        for (const unitName of unitNames) {
          const unitAlreadyUsed = isEventUsedInStoreOn(storeName, unitName);

          if (unitAlreadyUsed) {
            context.report({
              node,
              messageId: "duplicateOn",
              data: {
                storeName,
                unitName,
              },
            });

            return;
          }
        }

        markUnitAsUsedInStoreOn(storeName, unitNames);
      },
    };
  },
};

function normalizePossibleArrayNode(node) {
  if (node.type === "ArrayExpression") {
    return node.elements;
  }

  return [node];
}

function getNestedCallee(node) {
  const callee = node.callee;

  if (callee.object.type === "CallExpression") {
    return getNestedCallee(callee.object);
  }

  return callee.object;
}
