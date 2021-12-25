const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { buildObjectFromMapInText } = require("../../utils/builders");

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
        const METHOD_NAME = "forward";

        const localMethod = importedFromEffector.get(METHOD_NAME);
        if (!localMethod) {
          return;
        }

        const isEffectorMethod = node?.callee?.name === localMethod;
        if (!isEffectorMethod) {
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
                const sampleConfig = {
                  clock: forwardConfig.from.value,
                  target: forwardConfig.to.value,
                };

                yield fixer.replaceText(
                  node,
                  `sample(${buildObjectFromMapInText({
                    context,
                    map: sampleConfig,
                  })})`
                );

                const importNode = importNodes.get(METHOD_NAME);
                yield fixer.replaceText(importNode, "sample");
              },
            },
          ],
        });
      },
    };
  },
};
