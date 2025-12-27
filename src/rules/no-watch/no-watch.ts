import { ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"
import { SymbolFlags } from "typescript"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

export default createRule({
  name: "no-watch",
  meta: {
    type: "suggestion",
    docs: {
      description: "Restrict usage of `.watch` on any Effector Unit.",
    },
    messages: {
      restricted:
        "Using `.watch` method leads to imperative code. Replace it with an operator `sample` or use the `target` parameter of `sample` operator.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    type WatchCall = Node.CallExpression & { callee: Node.MemberExpression & { property: Node.Identifier } }

    return {
      [`CallExpression[callee.type="MemberExpression"][callee.property.name="watch"]`]: (node: WatchCall) => {
        const type = services.getTypeAtLocation(node.callee.object)
        if (!type.symbol) return

        const symbol = type.symbol.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(type.symbol) : type.symbol
        if (!isType.unit(symbol)) return

        context.report({ node, messageId: "restricted" })
      },
    }
  },
})
