const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { isInsideReactComponent } = require("../../utils/react");
const { nodeTypeIs } = require("../../utils/node-type-is");
const { traverseParentByType } = require("../../utils/traverse-parent-by-type");

function isInsideUseEventCall({ node, context }) {
  const calleeParentNode = traverseParentByType(node.parent, "CallExpression");

  if (calleeParentNode?.callee?.name === "useEvent") {
    return true;
  }

  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbids `Event` and `Effect` usage without `useEvent` in React components.",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("mandatory-useEvent"),
    },
    messages: {
      useEventNeeded:
        "{{ unitName }} must be wrapped with `useEvent` from `effector-react` before usage inside React components",
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.parserServices;

    // TypeScript-only rule, since units can be imported from anywhere
    if (parserServices.hasFullTypeInformation) {
      return {
        Identifier(node) {
          if (isInsideReactComponent(node)) {
            if (
              nodeTypeIs.effect({ node, context }) ||
              nodeTypeIs.event({ node, context })
            ) {
              if (!isInsideUseEventCall({ node, context })) {
                context.report({
                  node,
                  messageId: "useEventNeeded",
                  data: {
                    unitName: node.name,
                  },
                });
              }
            }
          }
        },
      };
    }

    return {};
  },
};
