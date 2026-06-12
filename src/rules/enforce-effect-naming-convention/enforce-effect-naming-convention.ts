import { ESLintUtils, TSESTree as Node, AST_NODE_TYPES as NodeType, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

type Suggestion = TSESLint.SuggestionReportDescriptor<"invalid" | "rename">

type ShapeProperty = Node.Property &
  ({ value: Node.Identifier } | { value: Node.AssignmentPattern & { left: Node.Identifier } })

export default createRule({
  name: "enforce-effect-naming-convention",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Fx as a suffix for any Effector Effect.",
    },
    messages: {
      invalid: 'Effect "{{ current }}" should be named with `Fx` suffix, rename it to "{{ fixed }}"',
      rename: 'Rename "{{ current }}" to "{{ fixed }}"',
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    return {
      [`${selector.variable}, ${selector.array.identifier}, ${selector.array.assignment}, ${selector.function.identifier}, ${selector.function.assignment}`]:
        (node: Node.Identifier) => {
          const type = services.getTypeAtLocation(node)

          const isEffect = isType.effect(type, services.program)
          if (!isEffect) return

          const data = { current: node.name, fixed: node.name + "Fx" }

          // type annotation is included in `range` so we can't reliably replace text without erasing the annotation
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

        const isEffect = isType.effect(type, services.program)
        if (!isEffect) return

        const data = { current: ident.name, fixed: ident.name + "Fx" }

        const suggestion: Suggestion = {
          messageId: "rename",
          data: { current: ident.name, fixed: data.fixed },
          fix: (fixer) =>
            node.shorthand
              ? fixer.insertTextAfter(node.key, `: ${data.fixed}`) // { x } -> { x: xFx }
              : fixer.replaceText(ident, data.fixed), // { x: y } -> { x: yFx }
        }

        context.report({ node: ident, messageId: "invalid", data, suggest: [suggestion] })
      },
    }
  },
})

const FxRegex = /Fx$/

const selector = {
  variable: `VariableDeclarator > Identifier.id[name!=${FxRegex}]`,
  array: {
    identifier: `ArrayPattern > Identifier.elements[name!=${FxRegex}]`,
    assignment: `ArrayPattern > AssignmentPattern > Identifier.left[name!=${FxRegex}]`,
  },
  shape: {
    identifier: `ObjectPattern > Property:has(> Identifier.value[name!=${FxRegex}])`,
    assignment: `ObjectPattern > Property:has(> AssignmentPattern:has(> Identifier.left[name!=${FxRegex}]))`,
  },
  function: {
    identifier: `:function > Identifier.params[name!=${FxRegex}]`,
    assignment: `:function > AssignmentPattern > Identifier.left[name!=${FxRegex}]`,
  },
}
