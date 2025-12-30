import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { locate } from "@/shared/locate"

type CombinatorOperator = "combine" | "merge"

export default createRule({
  name: "no-unnecessary-combination",
  meta: {
    type: "suggestion",
    docs: {
      description: "Forbid unnecessary combinations in `clock` and `source`.",
    },
    messages: {
      unnecessary: "{{ method }} is used under the hood of {{ property }} in {{ operator }}, you can omit it.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const operators = new Set<string>()
    const combinators = new Map<string, CombinatorOperator>()

    const PACKAGE_NAME = /^effector(?:\u002Fcompat)?$/
    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`

    type MethodCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }

    return {
      [`${importSelector} > ${selector.operator}`]: (node: Node.ImportSpecifier) => operators.add(node.local.name),

      [`${importSelector} > ${selector.combinator}`]: (node: Node.ImportSpecifier & { imported: { name: string } }) =>
        combinators.set(node.local.name, node.imported.name as CombinatorOperator),

      [`CallExpression${selector.call}:has(${selector.argument})`]: (node: MethodCall) => {
        if (!operators.has(node.callee.name)) return

        const [config] = node.arguments

        const clock = locate.property("clock", config)?.value
        const source = locate.property("source", config)?.value

        if (clock?.type === NodeType.CallExpression && clock.callee.type === NodeType.Identifier) {
          const method = combinators.get(clock.callee.name)

          if (method === "merge") {
            const data = { method: clock.callee.name, property: "clock", operator: node.callee.name }
            context.report({ node: clock, messageId: "unnecessary", data })
          }
        }

        if (source?.type === NodeType.CallExpression && source.callee.type === NodeType.Identifier) {
          const method = combinators.get(source.callee.name)

          // both "combine" and "merge" match
          if (method) {
            const data = { method: source.callee.name, property: "source", operator: node.callee.name }
            context.report({ node: source, messageId: "unnecessary", data })
          }
        }
      },
    }
  },
})

const selector = {
  operator: `ImportSpecifier[imported.name=/(sample|guard)/]`,
  combinator: `ImportSpecifier[imported.name=/(combine|merge)/]`,

  call: `[callee.type="Identifier"][arguments.length=1]`,
  argument: `ObjectExpression.arguments`,
}
