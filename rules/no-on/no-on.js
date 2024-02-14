const { createLinkToRule } = require("../../utils/create-link-to-rule");
const {
  traverseNestedObjectNode,
} = require("../../utils/traverse-nested-object-node");
const { is } = require("../../utils/is");
const { ESLintUtils } = require("@typescript-eslint/utils");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbids `.on` chaining on effector store.",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-on"),
    },
    messages: {
      noOn: "Method `.on` is forbidden on any effector store.",
    },
    schema: [],
  },
  create(context) {
    let parserServices;
    try {
      parserServices = ESLintUtils.getParserServices(context);
    } catch (err) {
      // no types information
    }

    if (!parserServices?.program) return {};

    return {
      'CallExpression[callee.property.name="on"]'(node) {
        const storeObject = traverseNestedObjectNode(
          getNestedCallee(node) ?? getAssignedVariable(node)
        );

        if (!is.store({ context, node: storeObject })) {
          return;
        }

        context.report({
          node,
          messageId: "noOn",
        });
      },
    };
  },
};

function getNestedCallee(node) {
  const { callee } = node;

  if (callee.object?.type === "CallExpression") {
    return getNestedCallee(callee.object);
  }

  return callee.object;
}

function getAssignedVariable(node) {
  const { parent } = node;

  if (parent.type === "VariableDeclarator") {
    return parent;
  }

  return getAssignedVariable(parent);
}
