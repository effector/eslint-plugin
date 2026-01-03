import { ESLintUtils, type TSESTree as Node, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

export default createRule({
  name: "enforce-effect-naming-convention",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Fx as a suffix for any Effector Effect.",
    },
    messages: {
      invalid: "Effect `{{ current }}` should be named with suffix, rename it to `{{ fixed }}`",
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
      [`VariableDeclarator[id.name!=${FxRegex}]`]: (node: VariableDeclarator) => {
        const type = services.getTypeAtLocation(node)

        const isEffect = isType.effect(type, services.program)
        if (!isEffect) return

        const current = node.id.name
        const fixed = current + "Fx"

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

const FxRegex = /Fx$/
