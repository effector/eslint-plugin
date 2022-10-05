const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { extractImportedFrom } = require("../../utils/extract-imported-from");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the use of patronum `debug`",
      category: "Quality",
      recommended: false,
      url: createLinkToRule("no-patronum-debug"),
    },
    messages: {
      noPatronumDebug: "Unexpected patronum `debug` statement",
      removePatronumDebug: "Remove this `debug` from patronum",
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const importedFromPatronum = new Map();
    const importNodes = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          packageName: ["patronum", "patronum/debug"],
          importMap: importedFromPatronum,
          nodeMap: importNodes,
          node,
        });
      },
      CallExpression(node) {
        const currentMethod = node?.callee?.name ?? node?.callee?.object?.name;
        const importedDebugFromPatronum = importedFromPatronum.get("debug");

        if (
          !importedDebugFromPatronum ||
          currentMethod !== importedDebugFromPatronum
        ) {
          return;
        }

        context.report({
          messageId: "noPatronumDebug",
          node,
          suggest: [
            {
              messageId: "removePatronumDebug",
              *fix(fixer) {
                yield* removeDebugFromPatronum({
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

function* removeDebugFromPatronum({
  fixer,
  node,
  context,
  importNodes,
  targetMethod = "debug",
}) {
  const sourceCode = context.getSourceCode();
  const startToken = sourceCode.getTokenBefore(node);

  // remove line with debug
  yield fixer.removeRange([startToken.range[1], node.range[1]]);
  const semi = sourceCode.getTokenBefore(node, {
    filter: (token) => token.value === ";",
  });

  if (semi) yield fixer.remove(semi);

  const importDebugNode = importNodes.get(targetMethod);

  if (!importDebugNode) {
    return null;
  }

  // remove import with debug
  const importParentNode = importDebugNode.parent;
  const amountImportFromPatronum = importParentNode.specifiers.length;

  /**
   * import { debug } from 'patronum'
   * import { debug } from 'patronum/debug'
   */
  if (amountImportFromPatronum === 1) {
    yield fixer.removeRange([
      importParentNode.range[0],
      importParentNode.range[1] + 1,
    ]);

    return null;
  }

  const importLast = importParentNode.specifiers[amountImportFromPatronum - 1];
  const filterTokenComma = { filter: (token) => token.value === "," };

  /**
   * import { debug, timeout } from 'patronum'
   * import { condition, debug, throttle } from 'patronum'
   */
  if (importDebugNode !== importLast) {
    const prevNode = sourceCode.getTokenBefore(importDebugNode);
    const comma = sourceCode.getTokenAfter(importDebugNode, filterTokenComma);

    yield fixer.removeRange([prevNode.range[1], importDebugNode.range[0]]);
    yield fixer.remove(importDebugNode);
    yield fixer.remove(comma);

    return null;
  }

  /**
   * import { condition, debug } from 'patronum'
   */
  const comma = sourceCode.getTokenBefore(importDebugNode, filterTokenComma);

  yield fixer.removeRange([comma.range[1], importDebugNode.range[0]]);
  yield fixer.remove(importDebugNode);
  yield fixer.remove(comma);
}
