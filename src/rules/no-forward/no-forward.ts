import { type TSESTree as Node, type TSESLint } from "@typescript-eslint/utils"
import { match, parse } from "esquery"
import type { Node as ESNode } from "estree"

import { createRule } from "@/shared/create"

export default createRule({
  name: "no-guard",
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

    const PACKAGE_NAME = /^effector(?:\u002Fcompat)?$/

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`
    const forwardSelector = `ImportSpecifier[imported.name="forward"]`
    const sampleSelector = `ImportSpecifier[imported.name="sample"]`

    const callSelector = `[callee.type="Identifier"][arguments.length=1]`
    const argumentSelector = `ObjectExpression.arguments`

    type ForwardCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }
    type MappingCall = Node.CallExpression & {
      arguments: [Node.Expression]
      callee: Node.MemberExpression & { property: Node.Identifier }
    }

    type ForwardParameter = "clock" | "fn" | "target"
    type ForwardParameterValue = Node.Property["value"]

    const query = {
      from: parse("Property.properties:has(Identifier.key[name=from]) > .value"),
      to: parse("Property.properties:has(Identifier.key[name=to]) > .value"),

      map: parse(
        "CallExpression[arguments.length=1]" + // CallExpression with single argument
          ":has(:first-child:expression.arguments)" + // whose first argument is of type Expression
          ":has(> MemberExpression.callee:has(Identifier.property[name='map']))", // with callee of form object.map
      ),

      prepend: parse(
        "CallExpression[arguments.length=1]" + // CallExpression with single argument
          ":has(:first-child:expression.arguments)" + // whose first argument is of type Expression
          ":has(> MemberExpression.callee:has(Identifier.property[name='prepend']))", // with callee of form object.prepend
      ),
    }

    return {
      [`${importSelector} > ${forwardSelector}`]: (node: Node.ImportSpecifier) => forwards.set(node.local.name, node),
      [`${importSelector} > ${sampleSelector}`]: (node: Node.ImportSpecifier) => (sample = node.local.name),

      [`CallExpression${callSelector}:has(${argumentSelector})`]: (node: ForwardCall) => {
        if (!forwards.has(node.callee.name)) return

        const config: { [k in ForwardParameter]?: ForwardParameterValue } = {}

        config.clock = match(node.arguments[0] as ESNode, query.from, { visitorKeys })[0] as ForwardParameterValue
        config.target = match(node.arguments[0] as ESNode, query.to, { visitorKeys })[0] as ForwardParameterValue

        // transform target prepend -> sample fn
        if (config.target) {
          const [call] = match(config.target as ESNode, query.prepend, { visitorKeys }) as MappingCall[]
          if (call) [config.target, config.fn] = [call.callee.object, call.arguments[0]]
        }

        // transform clock map -> sample fn (if no mapping yet)
        if (config.clock && !config.fn) {
          const [call] = match(config.clock as ESNode, query.map, { visitorKeys }) as MappingCall[]
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
