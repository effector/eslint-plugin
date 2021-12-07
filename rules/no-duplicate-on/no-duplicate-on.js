const { isStoreNameValid } = require("../../utils/is-store-name-valid");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

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

    function isEventUsedInStoreOn(storeNode, unitName) {
      const usedUnits = usedOns.get(storeNode);

      if (!usedUnits) {
        return false;
      }

      return usedUnits.has(unitName);
    }

    function markUnitAsUsedInStoreOn(storeNode, unitName) {
      let usedUnits = usedOns.get(storeNode);

      if (!usedUnits) {
        usedUnits = new Set();
        usedOns.set(storeNode, usedUnits);
      }

      usedUnits.add(unitName);
    }

    return {
      CallExpression(node) {
        const methodName = node.callee?.property?.name;
        if (methodName !== "on") {
          return;
        }

        const object = getNestedCallee(node);
        const objectName = object?.name;

        if (!objectName) {
          return;
        }

        const isEffectorStore = isStoreNameValid(objectName, context);
        if (!isEffectorStore) {
          return;
        }

        const unitName = node.arguments[0]?.name;

        const unitAlreadyUsed = isEventUsedInStoreOn(object, unitName);

        if (unitAlreadyUsed) {
          context.report({
            node,
            messageId: "duplicateOn",
            data: {
              storeName: objectName,
              unitName,
            },
          });

          return;
        }

        markUnitAsUsedInStoreOn(object, unitName);
      },
    };
  },
};

function getNestedCallee(node) {
  const callee = node.callee;

  if (callee.object.type === "CallExpression") {
    return getNestedCallee(callee.object);
  }

  return callee.object;
}
