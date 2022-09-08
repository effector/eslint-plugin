const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { isInsideReactComponent } = require("../../utils/react");
const { nodeTypeIs } = require("../../utils/node-type-is");
const { traverseParentByType } = require("../../utils/traverse-parent-by-type");
const { nodeIsType } = require("../../utils/node-is-type");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbids `Event` and `Effect` usage without `useUnit` in React components.",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("mandatory-scope-binding"),
    },
    messages: {
      useEventNeeded:
        "{{ unitName }} must be wrapped with `useUnit` from `effector-react` before usage inside React components",
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.parserServices;

    // TypeScript-only rule, since units can be imported from anywhere
    if (!parserServices.hasFullTypeInformation) {
      return {};
    }

    return {
      Identifier(node) {
        if (!isInsideReactComponent(node)) {
          return;
        }

        if (nodeIsType({ node })) {
          return;
        }

        if (
          nodeTypeIs.not.effect({ node, context }) &&
          nodeTypeIs.not.event({ node, context })
        ) {
          return;
        }

        if (isInsideEffectorHook({ node, context })) {
          return;
        }

        context.report({
          node,
          messageId: "useEventNeeded",
          data: {
            unitName: node.name,
          },
        });
      },
    };
  },
};

function isInsideEffectorHook({ node, context }) {
  const calleeParentNode = traverseParentByType(node.parent, "CallExpression");

  if (!calleeParentNode?.callee) return false;

  return nodeTypeIs.effectorReactHook({
    node: calleeParentNode.callee,
    context,
    hook: ["useEvent", "useUnit", "useStore"],
  });
}
