import { ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

export default createRule({
  name: "no-effect-use",
  meta: {
    type: "suggestion",
    docs: {
      description: "Forbid `.use` on Effector effects.",
    },
    messages: {
      restricted:
        "`.use` degrades type inference and risks a runtime error. Provide the handler to `createEffect`, or mock it in tests with `fork({ handlers })`.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    return {
      [selector.use]: (node: Node.MemberExpression) => {
        const type = services.getTypeAtLocation(node.object)

        if (isType.effect(type, services.program)) context.report({ node, messageId: "restricted" })
      },
    }
  },
})

const selector = {
  use: `MemberExpression[computed=false][property.name="use"]`,
}
