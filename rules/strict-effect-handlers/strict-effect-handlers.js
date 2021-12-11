const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { is } = require("../../utils/is");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbids mix of async functions and effects calls in effect handlers.",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("strict-effect-handlers"),
    },
    messages: {
      mixedCalls:
        "Handler of effect `{{ effectName }}` can lead to scope loosing in Fork API.",
    },
    schema: [],
  },
  create(context) {
    function onEffectHandler(node) {
      if (!node.body?.body) {
        return;
      }
      const effectName = node.parent?.parent?.id?.name ?? "Unknown";

      const handlerBody = node.body.body;

      const calledNodes = handlerBody
        .filter((bodyNode) => bodyNode.expression?.type === "AwaitExpression")
        .map((awaitNode) => awaitNode.expression.argument.callee);

      const hasEffects = calledNodes.some((calledNode) =>
        is.effect({ context, node: calledNode })
      );

      const hasRegularAsyncFunctions = calledNodes.some((calledNode) =>
        is.not.effect({ context, node: calledNode })
      );

      if (hasEffects && hasRegularAsyncFunctions) {
        context.report({
          node: node.parent,
          messageId: "mixedCalls",
          data: { effectName },
        });
      }
    }

    return {
      ArrowFunctionExpression: onEffectHandler,
      FunctionExpression: onEffectHandler,
      FunctionDeclaration: onEffectHandler,
    };
  },
};
