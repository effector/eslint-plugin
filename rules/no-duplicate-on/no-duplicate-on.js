const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { getNestedObjectName } = require("../../utils/get-nested-object-name");
const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { is } = require("../../utils/is");

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

    function isEventUsedInStoreOn(scope, storeName, unitName) {
      const usedOnsOnScope = usedOns.get(scope);

      if (!usedOnsOnScope) {
        return false;
      }

      const usedUnits = usedOnsOnScope.get(storeName);

      if (!usedUnits) {
        return false;
      }

      return usedUnits.has(unitName);
    }

    function markUnitAsUsedInStoreOn(scope, storeName, unitNames) {
      let usedOnsOnScope = usedOns.get(scope);

      if (!usedOnsOnScope) {
        usedOnsOnScope = new Map();
        usedOns.set(scope, usedOnsOnScope);
      }

      let usedUnits = usedOnsOnScope.get(storeName);

      if (!usedUnits) {
        usedUnits = new Set();
        usedOnsOnScope.set(storeName, usedUnits);
      }

      usedUnits.add(...unitNames);
    }

    return {
      'CallExpression[callee.property.name="on"]'(node) {
        const storeObject = traverseNestedObjectNode(
          getNestedCallee(node) ?? getAssignedVariable(node)
        );
        const storeName = getStoreName(storeObject);

        if (!is.store({ context, node: storeObject })) {
          return;
        }

        const triggerObjects = normalizePossibleArrayNode(node.arguments[0]);
        const unitNames = triggerObjects.map(getNestedObjectName);

        const scope = context.getScope();

        for (const unitName of unitNames) {
          const unitAlreadyUsed = isEventUsedInStoreOn(
            scope,
            storeName,
            unitName
          );

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

        markUnitAsUsedInStoreOn(scope, storeName, unitNames);
      },
    };
  },
};

function normalizePossibleArrayNode(node) {
  if (!node) {
    return [];
  }

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
  return node?.name ?? node?.id?.name;
}
