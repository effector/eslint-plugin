const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { traverseParentByType } = require("../../utils/traverse-parent-by-type");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { isMethod } = require("../../utils/method");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids ambiguity targets in `sample` and `guard`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-ambiguity-target"),
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
        extractImportedFrom({
          importMap: importedFromEffector,
          node,
          packageName: "effector",
        });
      },
      CallExpression(node) {
        const POSSIBLE_USELESS_METHODS = ["sample", "guard"];
        for (const method of POSSIBLE_USELESS_METHODS) {
          if (!isMethod({ node, importMap: importedFromEffector, method })) {
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
