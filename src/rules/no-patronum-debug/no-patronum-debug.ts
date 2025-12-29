import { type TSESTree as Node, AST_NODE_TYPES as NodeType, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"

export default createRule({
  name: "no-patronum-debug",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the use of `patronum` `debug`.",
    },
    messages: {
      unexpected: "Unexpected `debug` call.",
      remove: "Remove this `debug` call.",
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],
  create: (context) => {
    const debugs = new Set<string>()

    const PACKAGE_NAME = /^patronum(?:\u002Fdebug)?$/

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`
    const debugSelector = `ImportSpecifier[imported.name="debug"]`

    const callSelector = `[callee.type=Identifier], [callee.object.type=Identifier]`

    type DebugMember = Node.MemberExpression & { object: Node.Identifier }
    type DebugCall = Node.CallExpression & { callee: /* debug */ Node.Identifier | /* debug.some */ DebugMember }

    const toName = (node: DebugCall) => {
      switch (node.callee.type) {
        case NodeType.Identifier:
          return node.callee.name
        case NodeType.MemberExpression:
          return node.callee.object.name
      }
    }

    return {
      [`${importSelector} > ${debugSelector}`]: (node: Node.ImportSpecifier) => debugs.add(node.local.name),

      [`CallExpression:matches(${callSelector})`]: (node: DebugCall) => {
        const name = toName(node)
        if (!debugs.has(name)) return

        const suggestion = {
          messageId: "remove" as const,
          fix: (fixer: TSESLint.RuleFixer) => {
            if (node.parent.type === NodeType.ExpressionStatement) return fixer.remove(node.parent)
            else return fixer.replaceText(node, "undefined")
          },
        }

        context.report({ messageId: "unexpected", node: node.callee, suggest: [suggestion] })
      },
    }
  },
})
