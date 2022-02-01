const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { areNodesSameInText } = require("../../utils/are-nodes-same-in-text");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { buildObjectInText } = require("../../utils/builders");
const { method } = require("../../utils/method");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids unnecessary duplication in `clock` and `source`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-unnecessary-duplication"),
    },
    messages: {
      unnecessaryDuplication:
        "Same `source` and `clock` can be replaced with only one of them.",
      removeClock: "Remove `clock`",
      removeSource: "Remove `source`",
    },
    schema: [],
    hasSuggestions: true,
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

        const params = {
          source: node?.arguments?.[0]?.properties?.find(
            (n) => n.key.name === "source"
          ),
          clock: node?.arguments?.[0]?.properties?.find(
            (n) => n.key.name === "clock"
          ),
        };
        if (!params.source || !params.clock) {
          return;
        }

        const sameSourceAndClock = areNodesSameInText({
          context,
          nodes: [params.source?.value, params.clock?.value],
        });
        if (!sameSourceAndClock) {
          return;
        }

        reportUnnecessaryDuplication({
          context,
          node,
          params,
          firstArgument: node?.arguments?.[0],
        });
      },
    };
  },
};

function reportUnnecessaryDuplication({
  context,
  node,
  params,
  firstArgument,
}) {
  function excludeParamFromObjectInText(objectNode, paramToExcludeNode) {
    const properties = objectNode?.properties?.filter?.(
      (p) => p !== paramToExcludeNode
    );

    return buildObjectInText.fromArrayOfNodes({ properties, context });
  }

  context.report({
    node,
    messageId: "unnecessaryDuplication",
    suggest: [
      {
        messageId: "removeClock",
        fix(fixer) {
          return fixer.replaceText(
            firstArgument,
            excludeParamFromObjectInText(firstArgument, params.clock)
          );
        },
      },
      {
        messageId: "removeSource",
        fix(fixer) {
          return fixer.replaceText(
            firstArgument,
            excludeParamFromObjectInText(firstArgument, params.source)
          );
        },
      },
    ],
  });
}
