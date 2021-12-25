const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { traverseParentByType } = require("../../utils/traverse-parent-by-type");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { isMethod } = require("../../utils/method");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids useless calls of `sample` and `guard`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-useless-methods"),
    },
    messages: {
      uselessMethod:
        "Method `{{ methodName }}` does nothing in this case. You should assign the result to variable or pass `target` to it.",
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

          const resultAssignedInVariable = traverseParentByType(
            node,
            "VariableDeclarator"
          );
          if (resultAssignedInVariable) {
            continue;
          }

          const resultReturnedFromFactory = traverseParentByType(
            node,
            "ReturnStatement"
          );
          if (resultReturnedFromFactory) {
            continue;
          }

          const resultPartOfChain = traverseParentByType(
            node,
            "ObjectExpression"
          );
          if (resultPartOfChain) {
            continue;
          }

          const configHasTarget = node?.arguments?.[0]?.properties?.some(
            (prop) => prop?.key.name === "target"
          );
          if (configHasTarget) {
            continue;
          }

          const resultIsWatched = node?.parent?.property?.name === "watch";
          if (resultIsWatched) {
            continue;
          }

          const resultIsArgument = node?.parent?.type === "CallExpression";
          if (resultIsArgument) {
            continue;
          }

          context.report({
            node,
            messageId: "uselessMethod",
            data: {
              methodName: node?.callee?.name,
            },
          });
        }
      },
    };
  },
};
