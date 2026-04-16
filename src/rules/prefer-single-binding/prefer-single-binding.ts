import { ESLintUtils, type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"
import type { RuleContext, RuleFix, RuleFixer } from "@typescript-eslint/utils/ts-eslint"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"
import { PACKAGE_NAME } from "@/shared/package"

type MessageIds = "multipleUseUnit" | "mixedStoresAndEvents" | "singleUnitWithoutDestructuring"
type Options = [{ separation?: "forbid" | "allow" | "enforce" }?]
type Context = RuleContext<MessageIds, Options>
type Fixer = RuleFixer
type ParserServices = ReturnType<typeof ESLintUtils.getParserServices>
type GetNodeType = (node: Node.Expression | null | undefined) => UnitType

type UseUnitCall = {
  statement: Node.VariableDeclaration
  declarator: Node.VariableDeclarator
  init: Node.CallExpression
  id: Node.VariableDeclarator["id"]
}

type ShapeCall = Node.VariableDeclarator & {
  init: Node.CallExpression & {
    callee: Node.Identifier
    arguments: [Node.ObjectExpression]
  }
  id: Node.ObjectPattern
}

type ListCall = Node.VariableDeclarator & {
  init: Node.CallExpression & {
    callee: Node.Identifier
    arguments: [Node.ArrayExpression]
  }
  id: Node.ArrayPattern
}

type PlainCall = {
  init: Node.CallExpression
}

type UnitType = "store" | "event" | "effect" | "unknown"

type UnitBinding = {
  call: UseUnitCall
  unitNode: Node.Expression
  identNode: Node.ArrayPattern["elements"][number]
  propNode: Node.Property | null
}

const selector = {
  import: `ImportDeclaration[source.value=${PACKAGE_NAME.react}] > ImportSpecifier[imported.name=useUnit]`,
  variable: {
    shape: "VariableDeclarator[id.type=ObjectPattern]",
    list: "VariableDeclarator[id.type=ArrayPattern]",
  },
  call: "CallExpression.init[arguments.length=1][callee.type=Identifier]",
  arg: {
    shape: "ObjectExpression.arguments",
    list: "ArrayExpression.arguments",
  },
  plain: "VariableDeclarator[id.type=Identifier]",
} as const

function getTypeFromChecker(node: Node.Expression, services: ParserServices): UnitType {
  try {
    const checker = services.program?.getTypeChecker()
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    if (!tsNode) return "unknown"
    const type = checker?.getTypeAtLocation(tsNode)

    if (!type || !services.program) return "unknown"

    if (isType.store(type, services.program)) return "store"
    if (isType.event(type, services.program)) return "event"
    if (isType.effect(type, services.program)) return "effect"

    return "unknown"
  } catch {
    return "unknown"
  }
}

function collectBindings(calls: UseUnitCall[]): UnitBinding[] {
  const bindings: UnitBinding[] = []

  for (const call of calls) {
    const argument = call.init.arguments[0]
    if (!argument || argument.type === NodeType.SpreadElement) continue

    if (argument.type === NodeType.ArrayExpression && call.id.type === NodeType.ArrayPattern) {
      const elements = argument.elements
      const destructured = call.id.elements
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i]
        if (!el || el.type === NodeType.SpreadElement) continue
        bindings.push({
          call,
          unitNode: el,
          identNode: destructured[i] ?? null,
          propNode: null,
        })
      }
    }

    if (argument.type === NodeType.ObjectExpression && call.id.type === NodeType.ObjectPattern) {
      for (const prop of argument.properties) {
        if (prop.type !== NodeType.Property) continue
        bindings.push({
          call,
          unitNode: prop.value as Node.Expression,
          identNode: null,
          propNode: prop,
        })
      }
    }
  }

  return bindings
}

function groupBindingsByType(bindings: UnitBinding[], getNodeType: GetNodeType): Record<UnitType, UnitBinding[]> {
  const groups: Record<UnitType, UnitBinding[]> = { store: [], event: [], effect: [], unknown: [] }
  for (const binding of bindings) {
    const type = getNodeType(binding.unitNode)
    groups[type].push(binding)
  }
  return groups
}

function hasMixedTypes(call: UseUnitCall, getNodeType: GetNodeType): boolean {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return false

  const types = new Set<UnitType>()

  if (argument.type === NodeType.ArrayExpression) {
    for (const el of argument.elements) {
      if (!el || el.type === NodeType.SpreadElement) continue
      const t = getNodeType(el)
      if (t !== "unknown") types.add(t)
    }
  }

  if (argument.type === NodeType.ObjectExpression) {
    for (const prop of argument.properties) {
      if (prop.type !== NodeType.Property) continue
      const t = getNodeType(prop.value as Node.Expression)
      if (t !== "unknown") types.add(t)
    }
  }

  return types.size > 1
}

function removeStatement(
  fixer: Fixer,
  sourceCode: Context["sourceCode"],
  statement: Node.VariableDeclaration,
): RuleFix {
  const range = statement.range
  let startIndex = range[0]
  const lineStart = sourceCode.text.lastIndexOf("\n", startIndex - 1) + 1
  const textBefore = sourceCode.text.slice(lineStart, startIndex)

  if (/^\s*$/.test(textBefore)) startIndex = lineStart

  const endIndex = range[1]
  const nextChar = sourceCode.text[endIndex]
  const removeEnd = nextChar === "\n" || nextChar === "\r" ? endIndex + 1 : endIndex

  return fixer.removeRange([startIndex, removeEnd])
}

function generateMergeFix(fixer: Fixer, calls: UseUnitCall[], context: Context): RuleFix[] | null {
  const sourceCode = context.sourceCode
  const firstCall = calls[0]
  const firstArg = firstCall?.init.arguments[0]
  if (!firstArg || firstArg.type === NodeType.SpreadElement) return null

  const calleeName = firstCall.init.callee.type === NodeType.Identifier ? firstCall.init.callee.name : "useUnit"

  const isArrayForm = firstArg.type === NodeType.ArrayExpression
  const isObjectForm = firstArg.type === NodeType.ObjectExpression

  const allSameForm = calls.every((call) => {
    const arg = call.init.arguments[0]
    if (!arg || arg.type === NodeType.SpreadElement) return false
    return isArrayForm ? arg.type === NodeType.ArrayExpression : arg.type === NodeType.ObjectExpression
  })

  if (!allSameForm) return null

  const fixes: RuleFix[] = []
  const [first, ...rest] = calls
  if (!first) return null

  if (isArrayForm) {
    const allElements: string[] = []
    const allDestructured: string[] = []

    for (const call of calls) {
      const arg = call.init.arguments[0]
      if (arg?.type === NodeType.ArrayExpression) {
        for (const el of arg.elements) {
          if (el) allElements.push(sourceCode.getText(el))
        }
      }
      if (call.id.type === NodeType.ArrayPattern) {
        for (const el of call.id.elements) {
          if (el) allDestructured.push(sourceCode.getText(el))
        }
      }
    }

    fixes.push(
      fixer.replaceText(
        first.statement,
        `const [${allDestructured.join(", ")}] = ${calleeName}([${allElements.join(", ")}])`,
      ),
    )
  } else if (isObjectForm) {
    const allProperties: string[] = []
    const allDestructured: string[] = []

    for (const call of calls) {
      const arg = call.init.arguments[0]
      if (arg?.type === NodeType.ObjectExpression) {
        for (const prop of arg.properties) allProperties.push(sourceCode.getText(prop))
      }
      if (call.id.type === NodeType.ObjectPattern) {
        for (const prop of call.id.properties) allDestructured.push(sourceCode.getText(prop))
      }
    }

    fixes.push(
      fixer.replaceText(
        first.statement,
        `const { ${allDestructured.join(", ")} } = ${calleeName}({ ${allProperties.join(", ")} })`,
      ),
    )
  }

  for (const call of rest) fixes.push(removeStatement(fixer, sourceCode, call.statement))

  return fixes
}

function generateSeparationFix(fixer: Fixer, call: UseUnitCall, context: Context, getNodeType: GetNodeType): RuleFix[] {
  const sourceCode = context.sourceCode
  const argument = call.init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return []

  const calleeName = call.init.callee.type === NodeType.Identifier ? call.init.callee.name : "useUnit"

  const range = call.statement.range
  const lineStart = sourceCode.text.lastIndexOf("\n", range[0] - 1) + 1
  const indent = sourceCode.text.slice(lineStart, range[0])

  if (argument.type === NodeType.ObjectExpression) {
    const properties = argument.properties.filter((p): p is Node.Property => p.type === NodeType.Property)

    const byType = {
      store: properties.filter((p) => getNodeType(p.value as Node.Expression) === "store"),
      event: properties.filter((p) => getNodeType(p.value as Node.Expression) === "event"),
      effect: properties.filter((p) => getNodeType(p.value as Node.Expression) === "effect"),
    }

    const toKeyName = (p: Node.Property) =>
      p.key.type === NodeType.Identifier ? p.key.name : sourceCode.getText(p.key)

    const lines = Object.values(byType)
      .filter((group) => group.length > 0)
      .map(
        (group) =>
          `const { ${group.map(toKeyName).join(", ")} } = ${calleeName}({ ${group.map((p) => sourceCode.getText(p)).join(", ")} })`,
      )

    return [fixer.replaceText(call.statement, lines.join(`\n${indent}`))]
  }

  if (argument.type === NodeType.ArrayExpression && call.id.type === NodeType.ArrayPattern) {
    const elements = argument.elements
    const destructured = call.id.elements

    const indexed = elements
      .map((el, i) => ({ el, i }))
      .filter((x): x is { el: Node.Expression; i: number } => x.el !== null && x.el.type !== NodeType.SpreadElement)

    const byType = {
      store: indexed.filter(({ el }) => getNodeType(el) === "store"),
      event: indexed.filter(({ el }) => getNodeType(el) === "event"),
      effect: indexed.filter(({ el }) => getNodeType(el) === "effect"),
    }

    const getName = (i: number) => {
      const el = destructured[i]
      return el ? sourceCode.getText(el) : null
    }

    const lines = Object.values(byType)
      .filter((group) => group.length > 0)
      .map((group) => {
        const names = group.map(({ i }) => getName(i)).filter((x): x is string => x !== null)
        const units = group.map(({ el }) => sourceCode.getText(el))
        return `const [${names.join(", ")}] = ${calleeName}([${units.join(", ")}])`
      })

    return [fixer.replaceText(call.statement, lines.join(`\n${indent}`))]
  }

  return []
}

function reportMultipleCalls(context: Context, calls: UseUnitCall[]): void {
  const [, ...rest] = calls
  const captured = [...calls] // явно захватываем копию чтобы замыкание не мутировало
  for (const call of rest) {
    context.report({
      node: call.init,
      messageId: "multipleUseUnit",
      suggest: [
        {
          messageId: "multipleUseUnit",
          fix: (fixer) => generateMergeFix(fixer, captured, context),
        },
      ],
    })
  }
}

export default createRule<Options, MessageIds>({
  name: "prefer-single-binding",
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description:
        "Recommend using a single useUnit call instead of multiple. Non-destructuring calls, @@unitShape and mixed array/object forms are not handled.",
    },
    messages: {
      multipleUseUnit:
        "Multiple useUnit calls detected. Consider combining them into a single call for better performance.",
      mixedStoresAndEvents:
        "useUnit call contains both stores and events. Consider separating them into different calls.",
      singleUnitWithoutDestructuring:
        "useUnit called without destructuring alongside other useUnit calls. Consider combining all useUnit calls into a single destructured call.",
    },
    schema: [
      {
        type: "object",
        properties: {
          separation: {
            type: "string",
            enum: ["forbid", "allow", "enforce"],
            default: "forbid",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create(context) {
    const importedAs = new Set<string>()
    const separation = context.options[0]?.separation ?? "forbid"
    const useUnitCallsStack: UseUnitCall[][] = []
    const plainCallsStack: PlainCall[][] = []

    const services = ESLintUtils.getParserServices(context)

    const getNodeType: GetNodeType = (node) => {
      if (!node) return "unknown"
      return getTypeFromChecker(node, services)
    }

    const onFunctionEnter = (): void => {
      useUnitCallsStack.push([])
      plainCallsStack.push([])
    }

    const onFunctionExit = (): void => {
      const plainCalls = plainCallsStack.pop()
      const useUnitCalls = useUnitCallsStack.pop()
      if (!useUnitCalls) return

      if (separation === "forbid" && plainCalls && plainCalls.length > 0 && useUnitCalls.length > 0) {
        for (const call of plainCalls) {
          context.report({
            node: call.init,
            messageId: "singleUnitWithoutDestructuring",
          })
        }
      }

      if (separation === "forbid" && plainCalls && plainCalls.length > 1 && useUnitCalls.length === 0) {
        for (const call of plainCalls) {
          context.report({
            node: call.init,
            messageId: "multipleUseUnit",
          })
        }
      }

      if (useUnitCalls.length === 0) return

      if (separation === "enforce") {
        for (const call of useUnitCalls) {
          if (hasMixedTypes(call, getNodeType)) {
            context.report({
              node: call.init,
              messageId: "mixedStoresAndEvents",
              suggest: [
                {
                  messageId: "mixedStoresAndEvents",
                  fix: (fixer) => generateSeparationFix(fixer, call, context, getNodeType),
                },
              ],
            })
          }
        }
        return
      }

      if (useUnitCalls.length <= 1) return

      const getForm = (call: UseUnitCall): "array" | "object" | "unknown" => {
        const arg = call.init.arguments[0]
        if (!arg || arg.type === NodeType.SpreadElement) return "unknown"
        if (arg.type === NodeType.ArrayExpression) return "array"
        if (arg.type === NodeType.ObjectExpression) return "object"
        return "unknown"
      }

      if (separation === "allow") {
        const bindings = collectBindings(useUnitCalls)
        const groups = groupBindingsByType(bindings, getNodeType)
        for (const group of Object.values(groups)) {
          const groupCalls = [...new Set(group.map((b) => b.call))]
          if (groupCalls.length <= 1) continue
          const form = getForm(groupCalls[0]!)
          const allSameForm = groupCalls.every((c) => getForm(c) === form)
          if (!allSameForm) continue
          reportMultipleCalls(context, groupCalls)
        }
        return
      }

      // separation === "forbid"
      if (useUnitCalls.length <= 1) return

      const form = getForm(useUnitCalls[0]!)
      const allSameForm = useUnitCalls.every((c) => getForm(c) === form)

      if (allSameForm) {
        reportMultipleCalls(context, useUnitCalls)
      } else {
        const [, ...rest] = useUnitCalls
        for (const call of rest) {
          context.report({
            node: call.init,
            messageId: "multipleUseUnit",
          })
        }
      }
    }

    return {
      [selector.import]: (node: Node.ImportSpecifier) => void importedAs.add(node.local.name),

      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression": onFunctionEnter,

      "FunctionDeclaration:exit": onFunctionExit,
      "FunctionExpression:exit": onFunctionExit,
      "ArrowFunctionExpression:exit": onFunctionExit,

      [`${selector.variable.shape}:has(> ${selector.call}:has(${selector.arg.shape}))`](node: ShapeCall): void {
        if (!importedAs.has(node.init.callee.name)) return
        const current = useUnitCallsStack.at(-1)
        if (!current) return
        current.push({ statement: node.parent, declarator: node, init: node.init, id: node.id })
      },

      [`${selector.variable.list}:has(> ${selector.call}:has(${selector.arg.list}))`](node: ListCall): void {
        if (!importedAs.has(node.init.callee.name)) return
        const current = useUnitCallsStack.at(-1)
        if (!current) return
        current.push({ statement: node.parent, declarator: node, init: node.init, id: node.id })
      },

      [`${selector.plain}:has(> ${selector.call})`](
        node: Node.VariableDeclarator & { init: Node.CallExpression },
      ): void {
        if (node.init.arguments.length !== 1) return
        const arg = node.init.arguments[0]
        if (!arg || arg.type === NodeType.SpreadElement) return
        if (arg.type === NodeType.ArrayExpression && node.id.type === NodeType.ArrayPattern) return
        if (arg.type === NodeType.ObjectExpression && node.id.type === NodeType.ObjectPattern) return
        const callee = node.init.callee
        if (callee.type !== NodeType.Identifier) return
        if (!importedAs.has(callee.name)) return
        const current = plainCallsStack.at(-1)
        if (!current) return
        current.push({ init: node.init })
      },
    }
  },
})
