const { extractImportedFrom } = require("../../utils/extract-imported-from");
const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `forward``",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-forward"),
    },
    messages: {
      overMap:
        "Instead of `forward` with `{{ eventName }}.map` you can use `sample`",
      overPrepend:
        "Instead of `forward` with `{{ eventName }}.prepend` you can use `sample`",
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
        const localMethod = importedFromEffector.get("forward");
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

        // TODO: write rule here
      },
    };
  },
};
