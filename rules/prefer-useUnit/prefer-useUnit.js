const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { extractImportedFrom } = require("../../utils/extract-imported-from");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Suggests to replace old hooks `useStore`/`useEvent` by the new one `useUnit`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("prefer-useUnit"),
    },
    messages: {
      useUnitNeeded: "`{{ hookName }}` could be replaced by `useUnit`",
    },
    schema: [],
  },
  create(context) {
    const importedFromEffectorReact = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffectorReact,
          packageName: "effector-react",
          node,
        });
      },
      CallExpression(node) {
        const OLD_HOOKS = ["useStore", "useEvent"];
        const NEW_HOOK = ["useUnit"];

        for (const oldHookName of OLD_HOOKS) {
          const localOldHookName = importedFromEffectorReact.get(oldHookName);
          if (!localOldHookName) {
            continue;
          }

          const isOldHook = node.callee.name === localOldHookName;
          if (!isOldHook) {
            continue;
          }

          context.report({
            node,
            messageId: "useUnitNeeded",
            data: {
              hookName: oldHookName,
            },
          });
        }
      },
    };
  },
};
