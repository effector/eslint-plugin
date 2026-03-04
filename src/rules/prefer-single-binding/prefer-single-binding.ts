import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"
import type { RuleContext, RuleFix, RuleFixer } from "@typescript-eslint/utils/ts-eslint"

import { createRule } from "@/shared/create"

type MessageIds = "multipleUseUnit" | "mixedStoresAndEvents"
type Options = [{ allowSeparateStoresAndEvents?: boolean; enforceStoresAndEventsSeparation?: boolean }?]
type Context = RuleContext<MessageIds, Options>
type Fixer = RuleFixer

type UseUnitCall = {
  statement: TSESTree.VariableDeclaration
  declarator: TSESTree.VariableDeclarator
  init: TSESTree.CallExpression
  id: TSESTree.VariableDeclarator["id"]
}

type ElementInfo = {
  element: TSESTree.Expression
  type: string
  index: number
}

type PropertyInfo = {
  property: TSESTree.Property
  type: string
  index: number
}

type MixedTypes = {
  stores: ElementInfo[] | PropertyInfo[]
  events: ElementInfo[] | PropertyInfo[]
  allTypes: (ElementInfo | PropertyInfo)[]
  isObject?: boolean
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
          allowSeparateStoresAndEvents: {
            type: "boolean",
            default: false,
          },
          enforceStoresAndEventsSeparation: {
            type: "boolean",
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    fixable: "code",
  },
  defaultOptions: [],
  create: (context) => {
    const options = context.options[0] ?? {}
    const allowSeparateStoresAndEvents = options.allowSeparateStoresAndEvents ?? false
    const enforceStoresAndEventsSeparation = options.enforceStoresAndEventsSeparation ?? false

    return {
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(
        node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
      ) {
        const body = node.body.type === AST_NODE_TYPES.BlockStatement ? node.body.body : null
        if (!body) return

        const useUnitCalls: UseUnitCall[] = []

        body.forEach((statement) => {
          if (statement.type === AST_NODE_TYPES.VariableDeclaration && statement.declarations.length > 0) {
            statement.declarations.forEach((declarator) => {
              if (
                declarator.init &&
                declarator.init.type === AST_NODE_TYPES.CallExpression &&
                declarator.init.callee.type === AST_NODE_TYPES.Identifier &&
                declarator.init.callee.name === "useUnit"
              ) {
                useUnitCalls.push({
                  statement,
                  declarator,
                  init: declarator.init,
                  id: declarator.id,
                })
              }
            })
          }
        })

        if (enforceStoresAndEventsSeparation) {
          useUnitCalls.forEach((call) => {
            const mixedTypes = checkMixedTypes(call)
            if (mixedTypes) {
              context.report({
                node: call.init,
                messageId: "mixedStoresAndEvents",
                fix(fixer) {
                  return generateSeparationFix(fixer, call, mixedTypes, context)
                },
              })
            }
          })
          return
        }

        if (useUnitCalls.length > 1) {
          if (allowSeparateStoresAndEvents) {
            const groups = groupByType(useUnitCalls)
            if (groups.stores.length > 1) reportMultipleCalls(context, groups.stores)
            if (groups.events.length > 1) reportMultipleCalls(context, groups.events)
            if (groups.unknown.length > 1) reportMultipleCalls(context, groups.unknown)
          } else {
            useUnitCalls.forEach((call, index) => {
              if (index > 0) {
                context.report({
                  node: call.init,
                  messageId: "multipleUseUnit",
                  fix(fixer) {
                    return generateFix(fixer, useUnitCalls, context)
                  },
                })
              }
            })
          }
        }
      },
    }
  },
})

function checkMixedTypes(call: UseUnitCall): MixedTypes | null {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === AST_NODE_TYPES.SpreadElement) return null

  if (argument.type === AST_NODE_TYPES.ArrayExpression) {
    const elements = argument.elements.filter(
      (el): el is TSESTree.Expression => el !== null && el.type !== AST_NODE_TYPES.SpreadElement,
    )
    if (elements.length === 0) return null

    const types: ElementInfo[] = elements.map((element, index) => ({
      element,
      type: getElementType(element),
      index,
    }))

    const stores = types.filter((t) => t.type === "store")
    const events = types.filter((t) => t.type === "event")

    if (stores.length > 0 && events.length > 0) {
      return { stores, events, allTypes: types }
    }
  }

  if (argument.type === AST_NODE_TYPES.ObjectExpression) {
    const properties = argument.properties.filter(
      (prop): prop is TSESTree.Property => prop.type === AST_NODE_TYPES.Property,
    )
    if (properties.length === 0) return null

    const types: PropertyInfo[] = properties.map((prop, index) => ({
      property: prop,
      type: getElementType(prop.value as TSESTree.Expression),
      index,
    }))

    const stores = types.filter((t) => t.type === "store")
    const events = types.filter((t) => t.type === "event")

    if (stores.length > 0 && events.length > 0) {
      return { stores, events, allTypes: types, isObject: true }
    }
  }

  return null
}

function generateSeparationFix(fixer: Fixer, call: UseUnitCall, mixedTypes: MixedTypes, context: Context): RuleFix[] {
  const sourceCode = context.sourceCode

  const { stores, events, isObject } = mixedTypes
  const fixes: RuleFix[] = []

  if (isObject) {
    const storeInfos = stores as PropertyInfo[]
    const eventInfos = events as PropertyInfo[]

    const storeProps = storeInfos.map((s) => sourceCode.getText(s.property))
    const eventProps = eventInfos.map((e) => sourceCode.getText(e.property))

    const storeKeys = storeInfos.map((s) => {
      const key = s.property.key
      return key.type === AST_NODE_TYPES.Identifier ? key.name : sourceCode.getText(key)
    })

    const eventKeys = eventInfos.map((e) => {
      const key = e.property.key
      return key.type === AST_NODE_TYPES.Identifier ? key.name : sourceCode.getText(key)
    })

    const statementRange = call.statement.range
    if (!statementRange) return []
    const lineStart = sourceCode.text.lastIndexOf("\n", statementRange[0] - 1) + 1
    const indent = sourceCode.text.slice(lineStart, statementRange[0])

    const storesCode = `const { ${storeKeys.join(", ")} } = useUnit({ ${storeProps.join(", ")} });`
    const eventsCode = `const { ${eventKeys.join(", ")} } = useUnit({ ${eventProps.join(", ")} });`

    fixes.push(fixer.replaceText(call.statement, `${storesCode}\n${indent}${eventsCode}`))
  } else {
    const storeInfos = stores as ElementInfo[]
    const eventInfos = events as ElementInfo[]

    const storeElements = storeInfos.map((s) => sourceCode.getText(s.element))
    const eventElements = eventInfos.map((e) => sourceCode.getText(e.element))

    const destructured = call.id.type === AST_NODE_TYPES.ArrayPattern ? call.id.elements : []

    const storeNames = storeInfos
      .map((s) => {
        const el = destructured[s.index]
        return el ? sourceCode.getText(el) : null
      })
      .filter((x): x is string => x !== null)

    const eventNames = eventInfos
      .map((e) => {
        const el = destructured[e.index]
        return el ? sourceCode.getText(el) : null
      })
      .filter((x): x is string => x !== null)

    const statementRange = call.statement.range
    if (!statementRange) return []
    const lineStart = sourceCode.text.lastIndexOf("\n", statementRange[0] - 1) + 1
    const indent = sourceCode.text.slice(lineStart, statementRange[0])

    const storesCode = `const [${storeNames.join(", ")}] = useUnit([${storeElements.join(", ")}]);`
    const eventsCode = `const [${eventNames.join(", ")}] = useUnit([${eventElements.join(", ")}]);`

    fixes.push(fixer.replaceText(call.statement, `${storesCode}\n${indent}${eventsCode}`))
  }

  return fixes
}

function getElementType(element: TSESTree.Node | null | undefined): string {
  if (!element) return "unknown"

  if (element.type === AST_NODE_TYPES.Identifier) {
    return element.name.startsWith("$") ? "store" : "event"
  }

  if (element.type === AST_NODE_TYPES.MemberExpression) {
    const property = element.property
    if (property.type === AST_NODE_TYPES.Identifier) {
      const name = property.name

      if (name.startsWith("$")) return "store"

      const eventPatterns = [
        /Event$/i,
        /Changed$/i,
        /Triggered$/i,
        /Clicked$/i,
        /Pressed$/i,
        /^on[A-Z]/,
        /^handle[A-Z]/,
        /^set[A-Z]/,
        /^update[A-Z]/,
        /^submit[A-Z]/,
      ]

      const storePatterns = [/^is[A-Z]/, /^has[A-Z]/, /Store$/i, /State$/i, /^data$/i, /^value$/i, /^items$/i]

      if (eventPatterns.some((p) => p.test(name))) return "event"
      if (storePatterns.some((p) => p.test(name))) return "store"

      return "event"
    }
  }

  return "unknown"
}

function getUnitType(call: UseUnitCall): string {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === AST_NODE_TYPES.SpreadElement) return "unknown"

  const scoreTypes = (elements: string[]): string => {
    const storeCount = elements.filter((t) => t === "store").length
    const eventCount = elements.filter((t) => t === "event").length
    const unknownCount = elements.filter((t) => t === "unknown").length

    if (storeCount === elements.length) return "store"
    if (eventCount === elements.length) return "event"
    if (unknownCount === elements.length) return "unknown"
    if (storeCount > eventCount && storeCount > unknownCount) return "store"
    if (eventCount > storeCount && eventCount > unknownCount) return "event"
    return "unknown"
  }

  if (argument.type === AST_NODE_TYPES.ArrayExpression) {
    const elements = argument.elements.filter(
      (el): el is TSESTree.Expression => el !== null && el.type !== AST_NODE_TYPES.SpreadElement,
    )
    if (elements.length === 0) return "unknown"
    return scoreTypes(elements.map((el) => getElementType(el)))
  }

  if (argument.type === AST_NODE_TYPES.ObjectExpression) {
    const properties = argument.properties.filter(
      (prop): prop is TSESTree.Property => prop.type === AST_NODE_TYPES.Property,
    )
    if (properties.length === 0) return "unknown"
    return scoreTypes(properties.map((prop) => getElementType(prop.value as TSESTree.Expression)))
  }

  return "unknown"
}

function groupByType(useUnitCalls: UseUnitCall[]) {
  const stores: UseUnitCall[] = []
  const events: UseUnitCall[] = []
  const unknown: UseUnitCall[] = []

  useUnitCalls.forEach((call) => {
    const type = getUnitType(call)
    if (type === "store") stores.push(call)
    else if (type === "event") events.push(call)
    else unknown.push(call)
  })

  return { stores, events, unknown }
}

function reportMultipleCalls(context: Context, calls: UseUnitCall[]) {
  calls.forEach((call, index) => {
    if (index > 0) {
      context.report({
        node: call.init,
        messageId: "multipleUseUnit",
        fix(fixer) {
          return generateFix(fixer, calls, context)
        },
      })
    }
  })
}

function generateFix(fixer: Fixer, useUnitCalls: UseUnitCall[], context: Context): RuleFix[] | null {
  const sourceCode = context.sourceCode

  const firstArg = useUnitCalls[0]?.init.arguments[0]
  if (!firstArg || firstArg.type === AST_NODE_TYPES.SpreadElement) return null

  const isArrayForm = firstArg.type === AST_NODE_TYPES.ArrayExpression
  const isObjectForm = firstArg.type === AST_NODE_TYPES.ObjectExpression

  const allSameForm = useUnitCalls.every((call) => {
    const arg = call.init.arguments[0]
    if (!arg || arg.type === AST_NODE_TYPES.SpreadElement) return false
    if (isArrayForm) return arg.type === AST_NODE_TYPES.ArrayExpression
    if (isObjectForm) return arg.type === AST_NODE_TYPES.ObjectExpression
    return false
  })

  if (!allSameForm) return null

  const fixes: RuleFix[] = []

  const removeStatement = (statement?: TSESTree.VariableDeclaration) => {
    const range = statement?.range
    if (!range) return

    let startIndex = range[0]
    const lineStart = sourceCode.text.lastIndexOf("\n", startIndex - 1) + 1
    const textBefore = sourceCode.text.slice(lineStart, startIndex)

    if (/^\s*$/.test(textBefore)) startIndex = lineStart

    const endIndex = range[1]
    const nextChar = sourceCode.text[endIndex]
    const removeEnd = nextChar === "\n" || nextChar === "\r" ? endIndex + 1 : endIndex

    fixes.push(fixer.removeRange([startIndex, removeEnd]))
  }

  if (isArrayForm) {
    const allElements: string[] = []
    const allDestructured: string[] = []

    useUnitCalls.forEach((call) => {
      const arg = call.init.arguments[0]
      if (arg && arg.type === AST_NODE_TYPES.ArrayExpression) {
        arg.elements.forEach((el) => {
          if (el) allElements.push(sourceCode.getText(el))
        })
      }

      if (call.id.type === AST_NODE_TYPES.ArrayPattern) {
        call.id.elements.forEach((el) => {
          if (el) allDestructured.push(sourceCode.getText(el))
        })
      }
    })

    const combinedCode = `const [${allDestructured.join(", ")}] = useUnit([${allElements.join(", ")}]);`
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    useUnitCalls[0]?.statement && fixes.push(fixer.replaceText(useUnitCalls[0]?.statement, combinedCode))

    for (let i = 1; i < useUnitCalls.length; i++) {
      removeStatement(useUnitCalls[i]?.statement)
    }
  } else if (isObjectForm) {
    const allProperties: string[] = []
    const allDestructuredProps: string[] = []

    useUnitCalls.forEach((call) => {
      const arg = call.init.arguments[0]
      if (arg && arg.type === AST_NODE_TYPES.ObjectExpression) {
        arg.properties.forEach((prop) => allProperties.push(sourceCode.getText(prop)))
      }

      if (call.id.type === AST_NODE_TYPES.ObjectPattern) {
        call.id.properties.forEach((prop) => allDestructuredProps.push(sourceCode.getText(prop)))
      }
    })

    const combinedCode = `const { ${allDestructuredProps.join(", ")} } = useUnit({ ${allProperties.join(", ")} });`
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    useUnitCalls[0]?.statement && fixes.push(fixer.replaceText(useUnitCalls[0]?.statement, combinedCode))

    for (let i = 1; i < useUnitCalls.length; i++) {
      removeStatement(useUnitCalls[i]?.statement)
    }
  }

  return fixes
}
