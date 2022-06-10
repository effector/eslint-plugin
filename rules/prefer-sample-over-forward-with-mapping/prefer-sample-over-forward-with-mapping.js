const { extractImportedFrom } = require("../../utils/extract-imported-from");
const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { method } = require("../../utils/method");
const { replaceForwardBySample } = require("../../utils/replace-by-sample");
const { extractConfig } = require("../../utils/extract-config");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `forward` with `.map`/`.prepend`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("prefer-sample-over-forward-with-mapping"),
    },
    messages: {
      overMap:
        "Instead of `forward` with `{{ eventName }}.map` you can use `sample`",
      overPrepend:
        "Instead of `forward` with `{{ eventName }}.prepend` you can use `sample`",
      replaceWithSample: "Replace `forward` with `sample`.",
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

        const forwardConfig = extractConfig(["from", "to"], { node });

        if (!forwardConfig.from || !forwardConfig.to) {
          return;
        }

        function checkForMapping({ paramNode, methodName, messageId }) {
          if (paramNode.value?.type !== "CallExpression") {
            return;
          }

          if (paramNode.value?.callee?.property?.name !== methodName) {
            return;
          }

          const eventNode = traverseNestedObjectNode(
            paramNode.value?.callee?.object
          );
          const eventName = eventNode?.name;

          if (!eventName) {
            return;
          }

          context.report({
            node,
            messageId,
            data: {
              eventName,
            },
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
        }

        checkForMapping({
          paramNode: forwardConfig.from,
          methodName: "map",
          messageId: "overMap",
        });
        checkForMapping({
          paramNode: forwardConfig.to,
          methodName: "prepend",
          messageId: "overPrepend",
        });
      },
    };
  },
};
