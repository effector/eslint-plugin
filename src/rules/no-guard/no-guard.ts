import { type TSESTree as Node, AST_NODE_TYPES as NodeType, type TSESLint } from "@typescript-eslint/utils"
import { match, parse } from "esquery"
import type { Node as ESNode } from "estree"

import { createRule } from "@/shared/create"

export default createRule({
  name: "no-guard",
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `guard`.",
    },
    messages: {
      noGuard: "Use `sample` operator instead of `guard` as a more universal approach.",
      replaceWithSample: "Replace `guard` with `sample`.",
    },
    hasSuggestions: true,
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    let sample: string | undefined
    const guards = new Map<string, Node.ImportSpecifier>()

    const source = context.sourceCode
    const visitorKeys = source.visitorKeys

    const PACKAGE_NAME = /^effector(?:\u002Fcompat)?$/

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`
    const guardSelector = `ImportSpecifier[imported.name="guard"]`
    const sampleSelector = `ImportSpecifier[imported.name="sample"]`

    const callSelector = `[callee.type="Identifier"]`

    type GuardCall = Node.CallExpression & { callee: Node.Identifier }
    type MappingCall = Node.CallExpression & {
      arguments: [Node.Expression]
      callee: Node.MemberExpression & { property: Node.Identifier }
    }

    type GuardParameter = "clock" | "source" | "filter" | "fn" | "target"
    type GuardParameterValue = Node.Property["value"]

    const query = {
      clock: parse("Property.properties:has(> Identifier.key[name=clock]) > .value"),
      source: parse("Property.properties:has(> Identifier.key[name=source]) > .value"),
      filter: parse("Property.properties:has(> Identifier.key[name=filter]) > .value"),
      target: parse("Property.properties:has(> Identifier.key[name=target]) > .value"),

      prepend: parse(
        "CallExpression[arguments.length=1]" + // CallExpression with single argument
          ":has(:first-child:expression.arguments)" + // whose first argument is of type Expression
          ":has(> MemberExpression.callee:has(Identifier.property[name='prepend']))", // with callee of form object.prepend
      ),
    }

    return {
      [`${importSelector} > ${guardSelector}`]: (node: Node.ImportSpecifier) => guards.set(node.local.name, node),
      [`${importSelector} > ${sampleSelector}`]: (node: Node.ImportSpecifier) => (sample = node.local.name),

      [`CallExpression${callSelector}`]: (node: GuardCall) => {
        if (!guards.has(node.callee.name)) return

        const config: { [k in GuardParameter]?: GuardParameterValue } = {}

        // parse guard call
        if (node.arguments.length === 1 && node.arguments[0]!.type === NodeType.ObjectExpression) {
          const [arg] = node.arguments

          for (const key of ["clock", "source", "filter", "target"] as const)
            [config[key]] = match(arg as ESNode, query[key], { visitorKeys }) as GuardParameterValue[]
        } else if (node.arguments.length === 2 && node.arguments[1]!.type === NodeType.ObjectExpression) {
          const [clock, arg] = node.arguments as [GuardParameterValue, Node.ObjectExpression]

          config.clock = clock

          for (const key of ["source", "filter", "target"] as const)
            [config[key]] = match(arg as ESNode, query[key], { visitorKeys }) as GuardParameterValue[]
        } else return

        // transform prepend -> sample fn
        if (config.target) {
          const [call] = match(config.target as ESNode, query.prepend, { visitorKeys })
            .map((node) => node as MappingCall)
            .filter((node) => node === config.target)

          if (call) [config.target, config.fn] = [call.callee.object, call.arguments[0]]
        }

        const code = (["clock", "source", "filter", "fn", "target"] as const)
          .filter((key) => config[key] !== undefined)
          .map((key) => `${key}: ${source.getText(config[key])}`)
          .join(", ")

        const suggestion = {
          messageId: "replaceWithSample" as const,
          fix: function* (fixer: TSESLint.RuleFixer) {
            const fn = sample ?? "sample"
            yield fixer.replaceText(node, `${fn}({ ${code} })`)

            if (!sample) yield fixer.insertTextAfter(guards.get(node.callee.name)!, `, sample`)
          },
        }

        context.report({ messageId: "noGuard", node: node.callee, suggest: [suggestion] })
      },
    }
  },
})
