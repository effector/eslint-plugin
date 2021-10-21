const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { areNodesSameInText } = require("../../utils/are-nodes-same-in-text");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

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
    const sourceCode = context.getSourceCode();

    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffector,
          node,
          libraryName: "effector",
        });
      },
      CallExpression(node) {
        const METHODS_WITH_POSSIBLE_DUPLCATION = ["sample", "guard"];
        for (const method of METHODS_WITH_POSSIBLE_DUPLCATION) {
          const localMethod = importedFromEffector.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorMethod = node?.callee?.name === localMethod;
          if (!isEffectorMethod) {
            continue;
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
        }
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
    const newPropertiesText = properties
      .map((p) => context.getSourceCode().getText(p))
      .join(", ");

    return `{ ${newPropertiesText} }`;
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
