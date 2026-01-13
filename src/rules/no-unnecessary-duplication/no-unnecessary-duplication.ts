import { TSESTree as Node, AST_NODE_TYPES as NodeType, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { locate } from "@/shared/locate"
import { PACKAGE_NAME } from "@/shared/package"

export default createRule({
  name: "no-unnecessary-duplication",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid duplicate `source` and `clock` in `sample` and `guard`.",
    },
    messages: {
      duplicate: "Method `{{ method }}` has the same value for `source` and `clock`. Consider using only one of them.",

      removeClock: "Remove the `clock`",
      removeSource: "Remove the `source`",
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],
  create: (context) => {
    const imports = new Set<string>()

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME.core}]`

    type MethodCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }

    return {
      [`${importSelector} > ${selector.method}`]: (node: Node.ImportSpecifier) => imports.add(node.local.name),

      [`CallExpression${selector.call}:has(${selector.argument})`]: (node: MethodCall) => {
        if (!imports.has(node.callee.name)) return

        const [config] = node.arguments

        const source = locate.property("source", config)?.value
        if (!source) return

        const clock = locate.property("clock", config)?.value
        if (!clock) return

        const equal = compare(clock, source)
        if (!equal) return

        const suggestions = [
          {
            messageId: "removeClock" as const,
            fix: function* (fixer: TSESLint.RuleFixer) {
              yield fixer.remove(clock.parent)

              const after = context.sourceCode.getTokenAfter(clock.parent)
              if (after?.value === ",") yield fixer.remove(after)
            },
          },
          {
            messageId: "removeSource" as const,
            fix: function* (fixer: TSESLint.RuleFixer) {
              yield fixer.remove(source.parent)

              const after = context.sourceCode.getTokenAfter(source.parent)
              if (after?.value === ",") yield fixer.remove(after)
            },
          },
        ]

        const data = { method: node.callee.name }
        context.report({ node: config, messageId: "duplicate", data, suggest: suggestions })
      },
    }
  },
})

const selector = {
  method: `ImportSpecifier[imported.name=/(sample|guard)/]`,
  call: `[callee.type="Identifier"][arguments.length=1]`,
  argument: `ObjectExpression.arguments`,
}

function compare(clock: Node.Node, source: Node.Node, limit = 5): boolean {
  if (limit <= 0) return false

  if (clock.type === NodeType.Identifier)
    // clock: a, source: a
    return source.type === NodeType.Identifier && clock.name === source.name

  if (clock.type === NodeType.ArrayExpression) {
    if (clock.elements.length !== 1) return false // clock: [a, b] !== source: [a, b]

    let a: Node.Node, b: Node.Node

    if (source.type === NodeType.ArrayExpression)
      if (source.elements.length !== 1 /* clock: [a], source: [a, b] */) return false
      else /* clock: [a], source: [a] */ [a, b] = [clock.elements[0]!, source.elements[0]!]
    else /* clock: [a], source: a */ [a, b] = [clock.elements[0]!, source]

    return a.type === NodeType.Identifier && b.type === NodeType.Identifier && a.name === b.name
  }

  if (clock.type === NodeType.MemberExpression) {
    // clock: obj.a, source: obj.a
    if (source.type !== NodeType.MemberExpression) return false
    if (clock.computed || source.computed) return false
    if (clock.property.name !== source.property.name) return false

    return compare(clock.object, source.object, limit - 1)
  }

  // other expressions can't be guaranteed to be equal
  return false
}
