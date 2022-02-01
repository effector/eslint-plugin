const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { method } = require("../../utils/method");
const { replaceForwardBySample } = require("../../utils/replace-by-sample");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `forward`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-forward"),
    },
    messages: {
      noForward:
        "Instead of `forward` you can use `sample`, it is more extendable.",
      replaceWithSample: "Repalce `forward` with `sample`.",
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const importNodes = new Map();
    const importedFromEffector = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffector,
          nodeMap: importNodes,
          node,
          packageName: "effector",
        });
      },
      CallExpression(node) {
        if (
          method.isNot("forward", {
            node,
            importMap: importedFromEffector,
          })
        ) {
          return;
        }

        const forwardConfig = {
          from: node.arguments?.[0]?.properties.find(
            (n) => n.key?.name === "from"
          ),
          to: node.arguments?.[0]?.properties.find((n) => n.key?.name === "to"),
        };

        if (!forwardConfig.from || !forwardConfig.to) {
          return;
        }

        context.report({
          messageId: "noForward",
          node,
          suggest: [
            {
              messageId: "replaceWithSample",
              *fix(fixer) {
                yield* replaceForwardBySample(forwardConfig, {
                  fixer,
                  node,
                  context,
                  importNodes,
                });
              },
            },
          ],
        });
      },
    };
  },
};
