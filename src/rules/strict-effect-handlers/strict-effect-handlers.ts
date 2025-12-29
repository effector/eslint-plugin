import { ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

type FnContext = { effect: boolean; regular: boolean }

export default createRule({
  name: "strict-effect-handlers",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid mixing calls to both regular async functions and Effects in the same function.",
    },
    messages: {
      mixed: "This function can lead to losing Scope in Effector Fork API.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    const stack: FnContext[] = []

    type TrackedAwait = Node.AwaitExpression & { argument: Node.CallExpression | Node.NewExpression }

    const track = (node: TrackedAwait) => {
      const current = stack.at(-1)
      if (!current) return

      const callee = node.argument.callee
      const type = services.getTypeAtLocation(callee)
      const symbol = type.symbol ?? type.aliasSymbol

      if (!symbol) return (current.regular = true)

      const isEffect = isType.effect(symbol)

      if (isEffect) return (current.effect = true)
      else return (current.regular = true)
    }

    const enter = () => {
      stack.push({ effect: false, regular: false })
    }

    const exit = (node: Node.FunctionLike) => {
      const scope = stack.pop()
      if (!scope) return

      if (scope.effect && scope.regular) context.report({ node, messageId: "mixed" })
    }

    return {
      "ArrowFunctionExpression": enter,
      "ArrowFunctionExpression:exit": exit,

      "FunctionExpression": enter,
      "FunctionExpression:exit": exit,

      "FunctionDeclaration": enter,
      "FunctionDeclaration:exit": exit,

      "AwaitExpression:matches([argument.type='CallExpression'], [argument.type='NewExpression'])": track,
    }
  },
})
