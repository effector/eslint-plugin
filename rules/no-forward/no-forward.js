const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { buildObjectInText } = require("../../utils/builders");

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
                let mapperFunctionNode = null;

                let clockMapperUsed = false;
                let targetMapperUsed = false;

                let clockNode = forwardConfig.from.value;
                let targetNode = forwardConfig.to.value;

                if (
                  clockNode.type === "CallExpression" &&
                  clockNode?.callee?.property?.name === "map"
                ) {
                  mapperFunctionNode = clockNode?.arguments?.[0];
                  clockNode = clockNode.callee.object;
                  clockMapperUsed = true;
                }

                if (
                  targetNode.type === "CallExpression" &&
                  targetNode?.callee?.property?.name === "prepend"
                ) {
                  mapperFunctionNode = targetNode?.arguments?.[0];
                  targetNode = targetNode.callee.object;
                  targetMapperUsed = true;
                }

                // We cannot apply two mappers in one sample
                // Let's revert mappers and use .map + .prepend
                if (clockMapperUsed && targetMapperUsed) {
                  mapperFunctionNode = null;
                  clockNode = forwardConfig.from.value;
                  targetNode = forwardConfig.to.value;
                }

                yield fixer.replaceText(
                  node,
                  `sample(${buildObjectInText.fromMapOfNodes({
                    properties: {
                      clock: clockNode,
                      fn: mapperFunctionNode,
                      target: targetNode,
                    },
                    context,
                  })})`
                );

                yield fixer.replaceText(importNodes.get(METHOD_NAME), "sample");
              },
            },
          ],
        });
      },
    };
  },
};
