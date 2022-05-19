const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { method } = require("../../utils/method");

const METHODS = [
  "forward",
  "sample",
  "guard",
  "attach",
  "merge",
  "combine",
  "createApi",
];

const UNIT_CREATORS = ["createStore", "createEvent", "createEffect"];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids to use inline units in methods",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-inline-units"),
    },
    messages: {
      noInlineUnits:
        'Declare inline method "{{ inlineMethodName }}" in a variable',
    },
    schema: [],
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
        const isEffectorMethod = method.is(METHODS, {
          node,
          importMap: importedFromEffector,
        });

        if (!isEffectorMethod) {
          return;
        }

        const configNode = node?.arguments?.[0];
        const optionsNodes = configNode?.properties;
        let inlineMethodName;

        const hasInlineUnits = optionsNodes?.some((optionNode) => {
          const isFound = method.is(UNIT_CREATORS, {
            node: optionNode?.value,
            importMap: importedFromEffector,
          });

          if (isFound) {
            inlineMethodName = optionNode?.value?.callee?.name;
          }

          return isFound;
        });

        if (!hasInlineUnits) {
          return;
        }

        context.report({
          node,
          messageId: "noInlineUnits",
          data: { inlineMethodName },
        });
      },
    };
  },
};
