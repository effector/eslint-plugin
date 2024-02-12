const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { method } = require("../../utils/method");
const {} = require("../../utils/traverse-nested-object-node");

module.exports = {
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description: "Forbids unit duplicates on `source` and `clock``",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-duplicate-clock-or-source-array-values"),
    },
    messages: {
      duplicatesInClock: "Clock contains duplicate units - {{ memberPath }}.",
      duplicatesInSource: "Source contains duplicate units - {{ memberPath }}.",
      removeDuplicate: "Remove duplicate {{ memberPath }}.",
    },
    schema: [],
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
        if (
          method.isNot(["sample", "guard"], {
            node,
            importMap: importedFromEffector,
          })
        ) {
          return;
        }

        const properties = getSourceOrClockProperties(node.arguments[0]);

        properties.forEach(({ key, value }) => {
          const propType = key.name;
          const elements = value.elements;

          const usedUnits = new Set();

          for (const node of elements) {
            const memberPath = createMemberExpressionPath(node);

            if (usedUnits.has(memberPath)) {
              const messageId = getMessageIdByPropType(propType);

              context.report({
                node,
                messageId,
                data: {
                  memberPath,
                },
                suggest: [
                  {
                    messageId: "removeDuplicate",
                    data: { memberPath },
                    fix(fixer) {
                      return fixer.remove(node);
                    },
                  },
                ],
              });

              return;
            }

            usedUnits.add(memberPath);
          }
        });
      },
    };
  },
};

function createMemberExpressionPath(node, chain = "") {
  const compactStrings = (...args) => args.filter(Boolean).join(".");

  if (node.type === "MemberExpression") {
    const propertyName = node.property.name;

    const updatedChain = compactStrings(propertyName, chain);

    return createMemberExpressionPath(node.object, updatedChain);
  }

  chain = compactStrings(node.name, chain);

  // remove last dot
  return chain.slice(0, -1);
}

function getSourceOrClockProperties(node) {
  if (node.type !== "ObjectExpression") return [];

  const allowedProps = ["clock", "source"];

  const isClockOrSourceArray = (prop) => {
    return (
      allowedProps.includes(prop.key.name) &&
      prop.value.type === "ArrayExpression"
    );
  };

  return node.properties.filter(isClockOrSourceArray);
}

function getMessageIdByPropType(propType) {
  return propType === "clock" ? "duplicatesInClock" : "duplicatesInSource";
}
