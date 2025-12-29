import { ESLintUtils, type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

export default createRule({
  name: "no-getState",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid `.getState` calls on Effector stores.",
    },
    messages: {
      named:
        "Method `.getState` used on store `{{ name }}` can lead to race conditions. Replace with with `sample` or `attach`.",
      anonymous:
        "Method `.getState` used on store can lead to race conditions. Replace with with `sample` or `attach`.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    type GetStateCall = Node.CallExpression & { callee: Node.MemberExpression & { property: Node.Identifier } }

    const nameOf = (node: Node.Expression) => {
      if (node.type === NodeType.Identifier) return node.name
      if (node.type === NodeType.MemberExpression && !node.computed) return node.property.name
      return null
    }

    return {
      [`CallExpression[callee.type="MemberExpression"][callee.property.name="getState"]`]: (node: GetStateCall) => {
        const type = services.getTypeAtLocation(node.callee.object)

        const isStore = isType.store(type, services.program)
        if (!isStore) return

        const name = nameOf(node.callee.object)

        if (name) context.report({ node, messageId: "named", data: { name } })
        else context.report({ node, messageId: "anonymous" })
      },
    }
  },
})
