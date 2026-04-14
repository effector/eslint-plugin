import { ESLintUtils, type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"
import type { RuleContext, RuleFix, RuleFixer } from "@typescript-eslint/utils/ts-eslint"

import { createRule } from "@/shared/create"
import { PACKAGE_NAME } from "@/shared/package"

type MessageIds = "multipleUseUnit" | "mixedStoresAndEvents"
type Options = [{ allowSeparateStoresAndEvents?: boolean; enforceStoresAndEventsSeparation?: boolean }?]
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

type UnitType = "store" | "event" | "effect" | "unknown"

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
} as const

function getTypeFromChecker(node: Node.Expression, services: ParserServices): UnitType {
  try {
    if (!services.program) return "unknown"
    const checker = services.program.getTypeChecker()
    const tsNode = services.esTreeNodeToTSNodeMap.get(node)
    if (!tsNode) return "unknown"
    const type = checker.getTypeAtLocation(tsNode)
    const typeString = checker.typeToString(type)

    if (typeString.startsWith("Store<") || typeString.startsWith("StoreWritable<")) return "store"
    if (typeString.startsWith("Event<") || typeString.startsWith("EventCallable<")) return "event"
    if (typeString.startsWith("Effect<")) return "effect"

    const symbol = type.getSymbol() ?? type.aliasSymbol
    if (symbol) {
      const name = symbol.getName()
      if (name === "Store" || name === "StoreWritable") return "store"
      if (name === "Event" || name === "EventCallable") return "event"
      if (name === "Effect") return "effect"
    }

    return "unknown"
  } catch {
    return "unknown"
  }
}

function scoreTypes(types: UnitType[]): UnitType {
  const storeCount = types.filter((t) => t === "store").length
  const eventCount = types.filter((t) => t === "event").length
  const unknownCount = types.filter((t) => t === "unknown").length

  if (storeCount === types.length) return "store"
  if (eventCount === types.length) return "event"
  if (unknownCount === types.length) return "unknown"
  if (storeCount > eventCount && storeCount > unknownCount) return "store"
  if (eventCount > storeCount && eventCount > unknownCount) return "event"
  return "unknown"
}

function getCallType(call: UseUnitCall, getNodeType: GetNodeType): UnitType {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return "unknown"

  if (argument.type === NodeType.ArrayExpression) {
    const types = argument.elements
      .filter((el): el is Node.Expression => el !== null && el.type !== NodeType.SpreadElement)
      .map(getNodeType)
    return types.length === 0 ? "unknown" : scoreTypes(types)
  }

  if (argument.type === NodeType.ObjectExpression) {
    const types = argument.properties
      .filter((prop): prop is Node.Property => prop.type === NodeType.Property)
      .map((prop) => getNodeType(prop.value as Node.Expression))
    return types.length === 0 ? "unknown" : scoreTypes(types)
  }

  return "unknown"
}

function groupByType(calls: UseUnitCall[], getNodeType: GetNodeType): Record<string, UseUnitCall[]> {
  const groups: Record<string, UseUnitCall[]> = { store: [], event: [], effect: [], unknown: [] }
  for (const call of calls) groups[getCallType(call, getNodeType)]?.push(call)
  return groups
}

function* checkMixed(
  call: UseUnitCall,
  getNodeType: GetNodeType,
): Generator<{ stores: Node.Expression[]; events: Node.Expression[]; isObject: boolean }> {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return

  if (argument.type === NodeType.ArrayExpression) {
    const elements = argument.elements.filter(
      (el): el is Node.Expression => el !== null && el.type !== NodeType.SpreadElement,
    )
    const stores = elements.filter((el) => getNodeType(el) === "store")
    const events = elements.filter((el) => getNodeType(el) === "event")
    if (stores.length > 0 && events.length > 0) yield { stores, events, isObject: false }
  }

  if (argument.type === NodeType.ObjectExpression) {
    const properties = argument.properties.filter((prop): prop is Node.Property => prop.type === NodeType.Property)
    const stores = properties
      .filter((p) => getNodeType(p.value as Node.Expression) === "store")
      .map((p) => p.value as Node.Expression)
    const events = properties
      .filter((p) => getNodeType(p.value as Node.Expression) === "event")
      .map((p) => p.value as Node.Expression)
    if (stores.length > 0 && events.length > 0) yield { stores, events, isObject: true }
  }
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
  const firstArg = calls[0]?.init.arguments[0]
  if (!firstArg || firstArg.type === NodeType.SpreadElement) return null

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
        `const [${allDestructured.join(", ")}] = useUnit([${allElements.join(", ")}])`,
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
        `const { ${allDestructured.join(", ")} } = useUnit({ ${allProperties.join(", ")} })`,
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

  const range = call.statement.range
  const lineStart = sourceCode.text.lastIndexOf("\n", range[0] - 1) + 1
  const indent = sourceCode.text.slice(lineStart, range[0])

  if (argument.type === NodeType.ObjectExpression) {
    const properties = argument.properties.filter((p): p is Node.Property => p.type === NodeType.Property)
    const storeProps = properties.filter((p) => getNodeType(p.value as Node.Expression) === "store")
    const eventProps = properties.filter((p) => getNodeType(p.value as Node.Expression) === "event")

    const toKeyName = (p: Node.Property) =>
      p.key.type === NodeType.Identifier ? p.key.name : sourceCode.getText(p.key)

    const storesCode = `const { ${storeProps.map(toKeyName).join(", ")} } = useUnit({ ${storeProps.map((p) => sourceCode.getText(p)).join(", ")} })`
    const eventsCode = `const { ${eventProps.map(toKeyName).join(", ")} } = useUnit({ ${eventProps.map((p) => sourceCode.getText(p)).join(", ")} })`

    return [fixer.replaceText(call.statement, `${storesCode}\n${indent}${eventsCode}`)]
  }

  if (argument.type === NodeType.ArrayExpression && call.id.type === NodeType.ArrayPattern) {
    const elements = argument.elements
    const destructured = call.id.elements

    const indexed = elements
      .map((el, i) => ({ el, i }))
      .filter((x): x is { el: Node.Expression; i: number } => x.el !== null && x.el.type !== NodeType.SpreadElement)

    const storeItems = indexed.filter(({ el }) => getNodeType(el) === "store")
    const eventItems = indexed.filter(({ el }) => getNodeType(el) === "event")

    const getName = (i: number) => {
      const el = destructured[i]
      return el ? sourceCode.getText(el) : null
    }

    const storeNames = storeItems.map(({ i }) => getName(i)).filter((x): x is string => x !== null)
    const eventNames = eventItems.map(({ i }) => getName(i)).filter((x): x is string => x !== null)
    const storeElements = storeItems.map(({ el }) => sourceCode.getText(el))
    const eventElements = eventItems.map(({ el }) => sourceCode.getText(el))

    const storesCode = `const [${storeNames.join(", ")}] = useUnit([${storeElements.join(", ")}])`
    const eventsCode = `const [${eventNames.join(", ")}] = useUnit([${eventElements.join(", ")}])`

    return [fixer.replaceText(call.statement, `${storesCode}\n${indent}${eventsCode}`)]
  }

  return []
}

function reportMultipleCalls(context: Context, calls: UseUnitCall[]): void {
  const [, ...rest] = calls
  for (const call of rest) {
    context.report({
      node: call.init,
      messageId: "multipleUseUnit",
      fix: (fixer) => generateMergeFix(fixer, calls, context),
    })
  }
}

export default createRule<Options, MessageIds>({
  name: "prefer-single-binding",
  meta: {
    type: "suggestion",
    docs: {
      description: "Recommend using a single useUnit call instead of multiple",
    },
    messages: {
      multipleUseUnit:
        "Multiple useUnit calls detected. Consider combining them into a single call for better performance.",
      mixedStoresAndEvents:
        "useUnit call contains both stores and events. Consider separating them into different calls.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowSeparateStoresAndEvents: { type: "boolean", default: false },
          enforceStoresAndEventsSeparation: { type: "boolean", default: false },
        },
        additionalProperties: false,
      },
    ],
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const importedAs = new Set<string>()
    const options = context.options[0] ?? {}
    const allowSeparateStoresAndEvents = options.allowSeparateStoresAndEvents ?? false
    const enforceStoresAndEventsSeparation = options.enforceStoresAndEventsSeparation ?? false
    const useUnitCallsStack: UseUnitCall[][] = []

    let services: ParserServices | null = null
    try {
      const s = ESLintUtils.getParserServices(context, true)
      if (s.program) services = s
    } catch {
      services = null
    }

    const getNodeType: GetNodeType = (node) => {
      if (!node) return "unknown"
      if (!services) return "unknown"
      return getTypeFromChecker(node, services)
    }

    const onFunctionEnter = (): void => {
      useUnitCallsStack.push([])
    }

    const onFunctionExit = (): void => {
      const useUnitCalls = useUnitCallsStack.pop()
      if (!useUnitCalls || useUnitCalls.length === 0) return

      if (enforceStoresAndEventsSeparation) {
        for (const call of useUnitCalls) {
          if (checkMixed(call, getNodeType).next().done === false) {
            context.report({
              node: call.init,
              messageId: "mixedStoresAndEvents",
              fix: (fixer) => generateSeparationFix(fixer, call, context, getNodeType),
            })
          }
        }
        return
      }

      if (useUnitCalls.length <= 1) return

      if (allowSeparateStoresAndEvents) {
        const groups = groupByType(useUnitCalls, getNodeType)
        for (const group of Object.values(groups)) {
          if (group.length > 1) reportMultipleCalls(context, group)
        }
      } else {
        reportMultipleCalls(context, useUnitCalls)
      }
    }

    return {
      [selector.import]: (node: Node.ImportSpecifier) => void importedAs.add(node.local.name),

      "FunctionDeclaration": onFunctionEnter,
      "FunctionExpression": onFunctionEnter,
      "ArrowFunctionExpression": onFunctionEnter,

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
    }
  },
})
