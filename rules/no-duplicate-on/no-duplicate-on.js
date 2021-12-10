const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { getNestedObjectName } = require("../../utils/get-nested-object-name");
const { isStore } = require("../../utils/is");

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
      'CallExpression[callee.property.name="on"]'(node) {
        const storeObject = getNestedCallee(node) ?? getAssignedVariable(node);
        const storeName = getStoreName(storeObject);

        if (!isStore({ context, node: storeObject })) {
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
  const { callee } = node;

  if (callee.object?.type === "CallExpression") {
    return getNestedCallee(callee.object);
  }

  return callee.object;
}

function getAssignedVariable(node) {
  const { parent } = node;

  if (parent.type === "VariableDeclarator") {
    return parent;
  }

  return getAssignedVariable(parent);
}

function getStoreName(node) {
  return node.name ?? node.id.name;
}
