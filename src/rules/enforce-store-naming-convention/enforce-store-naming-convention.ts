import { ESLintUtils, TSESTree as Node, AST_NODE_TYPES as NodeType, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

type Options = { mode: "prefix" | "postfix" }
type Suggestion = TSESLint.SuggestionReportDescriptor<"invalid" | "rename">

type ShapeProperty = Node.Property &
  ({ value: Node.Identifier } | { value: Node.AssignmentPattern & { left: Node.Identifier } })

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
    schema: [
      {
        type: "object",
        properties: { mode: { type: "string", enum: ["prefix", "postfix"] } },
      },
    ],
    hasSuggestions: true,
  },
  defaultOptions: [{ mode: "prefix" }],
  create: (context, [options]) => {
    const services = ESLintUtils.getParserServices(context)

    const selector = createSelector(options.mode === "prefix" ? PrefixRegex : PostfixRegex)

    const rename = (node: Node.Identifier) => {
      const trimmed = node.name.replace(options.mode === "prefix" ? /\$+$/g : /^\$+/g, "")
      const fixed = options.mode === "prefix" ? `$${trimmed}` : `${trimmed}$`

      return { current: node.name, convention: options.mode, fixed }
    }

    return {
      [`${selector.variable}, ${selector.array.identifier}, ${selector.array.assignment}, ${selector.function.identifier}, ${selector.function.assignment}`]:
        (node: Node.Identifier) => {
          const type = services.getTypeAtLocation(node)

          const isStore = isType.store(type, services.program)
          if (!isStore) return

          const data = rename(node)

          // type annotation is included `range` so we can't reliably replace text without erasing the annotation
          if (node.typeAnnotation) return context.report({ node, messageId: "invalid", data })

          const suggestion: Suggestion = {
            messageId: "rename",
            data: { current: node.name, fixed: data.fixed },
            fix: (fixer) => fixer.replaceText(node, data.fixed),
          }

          context.report({ node, messageId: "invalid", data, suggest: [suggestion] })
        },

      [`${selector.shape.identifier}, ${selector.shape.assignment}`]: (node: ShapeProperty) => {
        const type = services.getTypeAtLocation(node.value)
        const ident = node.value.type === NodeType.Identifier ? node.value : node.value.left

        const isStore = isType.store(type, services.program)
        if (!isStore) return

        const data = rename(ident)

        // type annotation is included `range` so we can't reliably replace text without erasing the annotation
        if (ident.typeAnnotation) return context.report({ node: ident, messageId: "invalid", data })

        const suggestion: Suggestion = {
          messageId: "rename",
          data: { current: ident.name, fixed: data.fixed },
          fix: (fixer) =>
            node.shorthand
              ? fixer.insertTextAfter(node.key, `: ${data.fixed}`) // { x } -> { x: $x }
              : fixer.replaceText(ident, data.fixed), // { x: y } -> { x: $y }
        }

        context.report({ node: ident, messageId: "invalid", data, suggest: [suggestion] })
      },
    }
  },
})

const PrefixRegex = /^[^$]/
const PostfixRegex = /[^$]$/

const createSelector = (regex: RegExp) => ({
  variable: `VariableDeclarator > Identifier.id[name=${regex}]`,
  array: {
    identifier: `ArrayPattern > Identifier.elements[name=${regex}]`,
    assignment: `ArrayPattern > AssignmentPattern > Identifier.left[name=${regex}]`,
  },
  shape: {
    identifier: `ObjectPattern > Property:has(> Identifier.value[name=${regex}])`,
    assignment: `ObjectPattern > Property:has(> AssignmentPattern:has(> Identifier.left[name=${regex}]))`,
  },
  function: {
    identifier: `:function > Identifier.params[name=${regex}]`,
    assignment: `:function > AssignmentPattern > Identifier.left[name=${regex}]`,
  },
})
