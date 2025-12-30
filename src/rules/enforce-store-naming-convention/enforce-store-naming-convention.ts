import { ESLintUtils, type TSESTree as Node, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

type Options = { mode: "prefix" | "postfix" }

export default createRule<[Options], "invalid" | "rename">({
  name: "enforce-store-naming-convention",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce $ as a prefix/postfix for any Effector `Store`",
    },
    messages: {
      invalid: 'Store "{{ current }}" should be named with a `$` {{ convention }}, rename it to "{{ fixed }}"',
      rename: 'Rename "{{ current }}" to "{{ fixed }}"',
    },
    schema: [{ type: "object", properties: { mode: { type: "string", enum: ["prefix", "postfix"] } } }],
    hasSuggestions: true,
  },
  defaultOptions: [{ mode: "prefix" }],
  create: (context, [options]) => {
    const services = ESLintUtils.getParserServices(context)

    type VariableDeclarator = Node.VariableDeclarator & { id: Node.Identifier }

    const regex = options.mode === "prefix" ? PrefixRegex : PostfixRegex

    return {
      [`VariableDeclarator[id.name=${regex}]`]: (node: VariableDeclarator) => {
        const type = services.getTypeAtLocation(node)

        const isStore = isType.store(type, services.program)
        if (!isStore) return

        const current = node.id.name
        const trimmed = current.replaceAll(options.mode === "prefix" ? /\$+$/g : /^\$+/g, "")
        const fixed = options.mode === "prefix" ? `$${trimmed}` : `${trimmed}$`

        const data = { current, convention: options.mode, fixed }

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

const PrefixRegex = /^[^$]/
const PostfixRegex = /[^$]$/
