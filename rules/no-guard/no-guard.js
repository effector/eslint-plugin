const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { method } = require("../../utils/method");
const { replaceGuardBySample } = require("../../utils/replace-by-sample");
const { extractConfig } = require("../../utils/extract-config");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `guard`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-guard"),
    },
    messages: {
      noGuard:
        "Instead of `guard` you can use `sample`, it is more extendable.",
      replaceWithSample: "Replace `guard` with `sample`.",
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
          method.isNot("guard", {
            node,
            importMap: importedFromEffector,
          })
        ) {
          return;
        }

        const guardConfig = extractConfig(
          ["source", "clock", "target", "filter"],
          {
            node,
          }
        );

        if (!guardConfig.clock || !guardConfig.filter) {
          return;
        }

        context.report({
          messageId: "noGuard",
          node,
          suggest: [
            {
              messageId: "replaceWithSample",
              *fix(fixer) {
                yield* replaceGuardBySample(guardConfig, {
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
