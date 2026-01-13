import { type TSESTree as Node, type TSESLint } from "@typescript-eslint/utils"
import esquery from "esquery"
import type { Node as ESNode } from "estree"

import { createRule } from "@/shared/create"
import { locate } from "@/shared/locate"
import { PACKAGE_NAME } from "@/shared/package"

export default createRule({
  name: "no-forward",
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `forward`.",
    },
    messages: {
      noForward: "Use `sample` operator instead of `forward` as a more universal approach.",
      replaceWithSample: "Replace `forward` with `sample`.",
    },
    hasSuggestions: true,
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    let sample: string | undefined
    const forwards = new Map<string, Node.ImportSpecifier>()

    const source = context.sourceCode
    const visitorKeys = source.visitorKeys

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME.core}]`

    type ForwardCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }
    type MappingCall = Node.CallExpression & {
      arguments: [Node.Expression]
      callee: Node.MemberExpression & { property: Node.Identifier }
    }

    type ForwardParameter = "clock" | "fn" | "target"
    type ForwardParameterValue = Node.Property["value"]

    return {
      [`${importSelector} > ${selector.forward}`]: (node: Node.ImportSpecifier) => forwards.set(node.local.name, node),
      [`${importSelector} > ${selector.sample}`]: (node: Node.ImportSpecifier) => (sample = node.local.name),

      [`CallExpression${selector.call}:has(${selector.argument})`]: (node: ForwardCall) => {
        if (!forwards.has(node.callee.name)) return

        const config: { [k in ForwardParameter]?: ForwardParameterValue } = {}

        const arg = node.arguments[0]
        config.clock = locate.property("from", arg)?.value as ForwardParameterValue
        config.target = locate.property("to", arg)?.value as ForwardParameterValue

        // transform target prepend -> sample fn
        if (config.target) {
          const [call] = esquery
            .match(config.target as ESNode, query.prepend, { visitorKeys })
            .map((node) => node as MappingCall)
            .filter((node) => node === config.target)

          if (call) [config.target, config.fn] = [call.callee.object, call.arguments[0]]
        }

        // transform clock map -> sample fn (if no mapping yet)
        if (config.clock && !config.fn) {
          const [call] = esquery
            .match(config.clock as ESNode, query.map, { visitorKeys })
            .map((node) => node as MappingCall)
            .filter((node) => node === config.clock)

          if (call) [config.clock, config.fn] = [call.callee.object, call.arguments[0]]
        }

        const code = (["clock", "fn", "target"] as const)
          .filter((key) => config[key] !== undefined)
          .map((key) => `${key}: ${source.getText(config[key])}`)
          .join(", ")

        const suggestion = {
          messageId: "replaceWithSample" as const,
          fix: function* (fixer: TSESLint.RuleFixer) {
            const fn = sample ?? "sample"
            yield fixer.replaceText(node, `${fn}({ ${code} })`)

            if (!sample) yield fixer.insertTextAfter(forwards.get(node.callee.name)!, `, sample`)
          },
        }

        context.report({ messageId: "noForward", node: node.callee, suggest: [suggestion] })
      },
    }
  },
})

const selector = {
  forward: `ImportSpecifier[imported.name="forward"]`,
  sample: `ImportSpecifier[imported.name="sample"]`,

  call: `[callee.type="Identifier"][arguments.length=1]`,
  argument: `ObjectExpression.arguments`,
}

const query = {
  map: esquery.parse(
    "CallExpression[arguments.length=1]" + // CallExpression with single argument
      ":has(> :first-child:expression.arguments)" + // whose first argument is of type Expression
      ":has(> MemberExpression.callee:has(Identifier.property[name='map']))", // with callee of form object.map
  ),

  prepend: esquery.parse(
    "CallExpression[arguments.length=1]" + // CallExpression with single argument
      ":has(> :first-child:expression.arguments)" + // whose first argument is of type Expression
      ":has(> MemberExpression.callee:has(Identifier.property[name='prepend']))", // with callee of form object.prepend
  ),
}
