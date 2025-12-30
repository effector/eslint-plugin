import { ESLintUtils, type TSESTree as Node, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

export default createRule({
  name: "enforce-gate-naming-convention",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce a Gate is named capitalized like a React Component",
    },
    messages: {
      invalid: 'Gate "{{ current }}" should be named with first capital letter, rename it to "{{ fixed }}"',
      rename: 'Rename "{{ current }}" to "{{ fixed }}"',
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    type VariableDeclarator = Node.VariableDeclarator & { id: Node.Identifier }

    return {
      [`VariableDeclarator[id.name=${GateRegex}]`]: (node: VariableDeclarator) => {
        const type = services.getTypeAtLocation(node)

        const isGate = isType.gate(type)
        if (!isGate) return

        const current = node.id.name
        const fixed = current[0]!.toUpperCase() + current.slice(1)

        const data = { current, fixed }

        const suggestion = {
          messageId: "rename" as const,
          data: { current, fixed },
          fix: (fixer: TSESLint.RuleFixer) => fixer.replaceText(node.id, fixed),
        }

        context.report({ node: node.id, messageId: "invalid", data, suggest: [suggestion] })
      },
    }
  },
})

const GateRegex = /^[^A-Z]/
