const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");
const { traverseParentByType } = require("../../utils/traverse-parent-by-type");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids ambiguity targets in `sample` and `guard`",
      category: "Quality",
      recommended: true,
    },
    messages: {
      ambiguityTarget:
        "Method `{{ methodName }}` returns `target` and assigns the result to a variable. Consider removing one of them.",
    },
    schema: [],
  },
  create(context) {
    const importedFromEffector = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFromEffector(importedFromEffector, node);
      },
      CallExpression(node) {
        const POSSIBLE_USELESS_METHODS = ["sample", "guard"];
        for (const method of POSSIBLE_USELESS_METHODS) {
          const localMethod = importedFromEffector.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorMethod = node?.callee?.name === localMethod;
          if (!isEffectorMethod) {
            continue;
          }

          const configHasTarget = node?.arguments?.[0]?.properties?.some(
            (prop) => prop?.key.name === "target"
          );
          if (!configHasTarget) {
            continue;
          }

          const resultAssignedInVariable = traverseParentByType(
            node,
            "VariableDeclarator",
            { stopOnTypes: ["BlockStatement"] }
          );
          const resultPartOfChain = traverseParentByType(
            node,
            "ObjectExpression"
          );

          if (resultAssignedInVariable || resultPartOfChain) {
            context.report({
              node,
              messageId: "ambiguityTarget",
              data: {
                methodName: node?.callee?.name,
              },
            });

            continue;
          }
        }
      },
    };
  },
};
