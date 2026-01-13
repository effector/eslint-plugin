import { ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

export default createRule({
  name: "no-domain-unit-creators",
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow using Domain methods to create units.",
    },
    messages: {
      avoid:
        "Avoid using `.{{ method }}` on a Domain instance. Use a standard factory unit creator `{{ factory }}` with a `domain` option instead.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    type DomainMethodCall = Node.CallExpression & { callee: Node.MemberExpression & { property: Node.Identifier } }

    return {
      [`CallExpression:has(> ${selector.member})`]: (node: DomainMethodCall) => {
        const name = node.callee.property.name
        if (!METHODS.has(name)) return

        const type = services.getTypeAtLocation(node.callee.object)
        if (!isType.domain(type, services.program)) return

        const factory = ALIAS_MAP.get(name) ?? name

        context.report({ node, messageId: "avoid", data: { method: name, factory } })
      },
    }
  },
})

const ALIAS_MAP = new Map<string, string>()
  .set("event", "createEvent")
  .set("store", "createStore")
  .set("effect", "createEffect")
  .set("domain", "createDomain")

const METHODS = new Set([...ALIAS_MAP.values(), ...ALIAS_MAP.keys()])

const selector = {
  member: `MemberExpression.callee[property.type="Identifier"]`,
}
