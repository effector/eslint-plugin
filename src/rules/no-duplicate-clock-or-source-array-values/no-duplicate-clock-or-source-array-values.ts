import { type TSESTree as Node, AST_NODE_TYPES as NodeType, type TSESLint } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { locate } from "@/shared/locate"
import { PACKAGE_NAME } from "@/shared/package"

type FieldName = "clock" | "source"

export default createRule({
  name: "no-duplicate-clock-or-source-array-values",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid providing duplicate units in `clock` and `source` arrays in `sample` and `guard`.",
    },
    messages: {
      duplicate: "`{{ field }}` contains a duplicate unit `{{ unit }}`.",
      remove: "Remove duplicate unit `{{ unit }}`.",
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],
  create: (context) => {
    const imports = new Set<string>()

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME.core}]`

    type MethodCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }

    const analyze = (node: Node.ArrayExpression, field: FieldName) => {
      const seen = new Map<string, Node.Node>()

      const entries = node.elements
        .filter((item) => item !== null)
        .filter((item) => item.type !== NodeType.SpreadElement)

      for (const entry of entries) {
        const root = traverseToRoot(entry)
        if (!root) continue

        const name = [root.node.name, ...root.path].join(".")

        if (seen.has(name)) report(entry, name, field)
        else seen.set(name, entry)
      }
    }

    const report = (node: Node.Node, name: string, field: FieldName) => {
      const data = { field, unit: name }
      const suggestion = {
        messageId: "remove" as const,
        data: { unit: name },
        fix: function* (fixer: TSESLint.RuleFixer) {
          yield fixer.remove(node)

          // this is a duplicate - we're sure there was another unit before
          const before = context.sourceCode.getTokenBefore(node)
          if (before?.value === ",") yield fixer.remove(before)
        },
      }

      context.report({ node, messageId: "duplicate", data, suggest: [suggestion] })
    }

    return {
      [`${importSelector} > ${selector.method}`]: (node: Node.ImportSpecifier) => imports.add(node.local.name),

      [`CallExpression${selector.call}:has(${selector.argument})`]: (node: MethodCall) => {
        if (!imports.has(node.callee.name)) return

        const [config] = node.arguments

        const clock = locate.property("clock", config)
        const source = locate.property("source", config)

        if (clock?.value?.type === NodeType.ArrayExpression) analyze(clock.value, "clock")
        if (source?.value?.type === NodeType.ArrayExpression) analyze(source.value, "source")
      },
    }
  },
})

const selector = {
  method: `ImportSpecifier[imported.name=/(sample|guard)/]`,
  call: `[callee.type="Identifier"][arguments.length=1]`,
  argument: `ObjectExpression.arguments`,
}

type NodeReference = { node: Node.Identifier; path: string[] }

// traverse plain member expression
function traverseToRoot(node: Node.Expression, path: string[] = []): NodeReference | null {
  if (node.type === NodeType.Identifier) return { node, path }

  if (node.type === NodeType.MemberExpression && node.property.type === NodeType.Identifier)
    return traverseToRoot(node.object, [node.property.name, ...path])

  return null
}
