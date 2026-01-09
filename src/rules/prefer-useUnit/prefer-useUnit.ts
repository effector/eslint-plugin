import { type TSESTree as Node } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { PACKAGE_NAME } from "@/shared/package"

type LegacyHook = "useStore" | "useEvent"

export default createRule({
  name: "prefer-useUnit",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer `useUnit` over deprecated `useStore` and `useEvent` hooks.",
    },
    messages: {
      useUseUnit: "`{{ name }}` should be replaced with `useUnit`.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const imports = new Map<string, LegacyHook>()

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME.react}]`

    type HookCall = Node.CallExpression & { callee: Node.Identifier }

    return {
      [`${importSelector} > ${selector.useStore}`]: (node: Node.ImportSpecifier) =>
        void imports.set(node.local.name, "useStore"),

      [`${importSelector} > ${selector.useEvent}`]: (node: Node.ImportSpecifier) =>
        void imports.set(node.local.name, "useEvent"),

      [`CallExpression[callee.type="Identifier"]`]: (node: HookCall) => {
        const hook = imports.get(node.callee.name)
        if (!hook) return

        context.report({ node, messageId: "useUseUnit", data: { name: hook } })
      },
    }
  },
})

const selector = {
  useStore: `ImportSpecifier[imported.name=useStore]`,
  useEvent: `ImportSpecifier[imported.name=useEvent]`,
}
