import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { locate } from "@/shared/locate"

export default createRule({
  name: "no-ambiguity-target",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid ambiguous target in `sample` and `guard`.",
    },
    messages: {
      ambiguous:
        "Method `{{ method }}` both specifies `target` option and assigns the result to a variable. Consider removing one of them.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const imports = new Set<string>()

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`

    const usageStack: boolean[] = []

    type MethodCall = Node.CallExpression & { callee: Node.Identifier }

    // TODO: Implement rule logic
    return {
      "ReturnStatement": () => usageStack.push(true),
      "ReturnStatement:exit": () => usageStack.pop(),

      "VariableDeclarator": () => usageStack.push(true),
      "VariableDeclarator:exit": () => usageStack.pop(),

      "ObjectExpression": () => usageStack.push(true),
      "ObjectExpression:exit": () => usageStack.pop(),

      "BlockStatement": () => usageStack.push(false),
      "BlockStatement:exit": () => usageStack.pop(),

      [`${importSelector} > ${selector.method}`]: (node: Node.ImportSpecifier) => imports.add(node.local.name),

      [`CallExpression[callee.type="Identifier"]`]: (node: MethodCall) => {
        const isTracked = imports.has(node.callee.name)
        if (!isTracked) return

        const isUsed = usageStack.at(-1) ?? false
        if (!isUsed) return

        const [config] = node.arguments

        if (config?.type !== NodeType.ObjectExpression) /* can't have a target */ return

        const target = locate.property("target", config)
        if (!target) return

        context.report({ node, messageId: "ambiguous", data: { method: node.callee.name } })
      },
    }
  },
})

const PACKAGE_NAME = /^effector(?:\u002Fcompat)?$/

const selector = {
  method: `ImportSpecifier[imported.name=/(sample|guard)/]`,
}
