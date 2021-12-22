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
      mixedCallsInHandler:
        "Handler of effect `{{ effectName }}` can lead to scope loosing in Fork API.",
      mixedCallsInFunction:
        "Function `{{ functionName }}` can lead to scope loosing in Fork API.",
    },
    schema: [],
  },
  create(context) {
    function onEffectHandler(node) {
      const functionBody = node.body?.body;

      if (!Array.isArray(functionBody)) {
        return;
      }

      const calledNodes = functionBody
        .filter((bodyNode) => bodyNode.expression?.type === "AwaitExpression")
        .map((awaitNode) => ({
          node: awaitNode.expression.argument.callee,
          context,
        }));

      const hasEffects = calledNodes.some(is.effect);
      const hasRegularAsyncFunctions = calledNodes.some(is.not.effect);

      const hasError = hasEffects && hasRegularAsyncFunctions;

      if (!hasError) {
        return;
      }

      const isEffectHandler = is.effect({
        node: node.parent?.parent,
        context,
      });

      if (isEffectHandler) {
        const effectName = node.parent?.parent?.id?.name ?? "Unknown";

        context.report({
          node: node.parent,
          messageId: "mixedCallsInHandler",
          data: { effectName },
        });
      } else {
        const functionName = node.id?.name ?? "Unknown";

        context.report({
          node,
          messageId: "mixedCallsInFunction",
          data: { functionName },
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
