import { ESLintUtils, type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"
import type { RuleContext, RuleFix, RuleFixer } from "@typescript-eslint/utils/ts-eslint"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"
import { PACKAGE_NAME } from "@/shared/package"

type MessageIds = "multipleUseUnit" | "mixedStoresAndEvents"
type Options = [{ separation?: "forbid" | "allow" | "enforce" }?]
type Context = RuleContext<MessageIds, Options>
type Fixer = RuleFixer
type SourceCode = Context["sourceCode"]
type Scope = ReturnType<SourceCode["getScope"]>
type GetNodeType = (node: Node.Expression) => UnitType

type UseUnitCall = {
  statement: Node.VariableDeclaration
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

type PlainCall = Node.VariableDeclarator & {
  init: Node.CallExpression
  id: Node.Identifier
}

type UnitType = "store" | "event" | "effect" | "unknown"

type UnitBinding = {
  call: UseUnitCall
  unitNode: Node.Expression
}

/** A `useUnit` binding normalized into a form-independent shape so array, object and plain calls can merge. */
type NormalizedBinding = {
  /** local variable identifier */
  local: string
  /** unit expression text */
  unit: string
  /** unit expression node (for scope / hoisting analysis) */
  unitNode: Node.Expression
}

const selector = {
  import: `ImportDeclaration[source.value=${PACKAGE_NAME.react}] > ImportSpecifier[imported.name=useUnit]`,
  variable: {
    shape: "VariableDeclarator[id.type=ObjectPattern]",
    list: "VariableDeclarator[id.type=ArrayPattern]",
    plain: "VariableDeclarator[id.type=Identifier]",
  },
  call: "CallExpression.init[arguments.length=1][callee.type=Identifier]",
  arg: {
    shape: "ObjectExpression.arguments",
    list: "ArrayExpression.arguments",
  },
} as const

function keyName(key: Node.Property["key"]): string | null {
  if (key.type === NodeType.Identifier) return key.name
  if (key.type === NodeType.Literal) return String(key.value)
  return null
}

/** Unit expression nodes of a call, regardless of whether it can be normalized (used for hoisting analysis). */
function unitExpressionNodes(call: UseUnitCall): Node.Expression[] {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return []

  if (argument.type === NodeType.ArrayExpression) {
    return argument.elements.filter((el): el is Node.Expression => el !== null && el.type !== NodeType.SpreadElement)
  }
  if (argument.type === NodeType.ObjectExpression) {
    return argument.properties
      .filter((p): p is Node.Property => p.type === NodeType.Property)
      .map((p) => p.value as Node.Expression)
  }
  return [argument]
}

/**
 * Normalizes a call into bindings. Returns `null` when a binding can't be safely converted
 * between forms — array holes, rest/spread, defaults, nested or computed patterns, or a
 * non-destructuring call whose argument is a collection (`const x = useUnit([...])`).
 *
 * Object keys are taken from the local variable name (not the source key), which makes
 * renamed keys (`{ a: b }` → `{ b }`) and form conversion collision-free.
 */
function extractBindings(call: UseUnitCall, sourceCode: SourceCode): NormalizedBinding[] | null {
  const argument = call.init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return null

  if (argument.type === NodeType.ArrayExpression && call.id.type === NodeType.ArrayPattern) {
    const elements = argument.elements
    const targets = call.id.elements
    if (elements.length !== targets.length) return null

    const bindings: NormalizedBinding[] = []
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      const target = targets[i]
      if (!el || el.type === NodeType.SpreadElement) return null
      if (!target || target.type !== NodeType.Identifier) return null
      bindings.push({ local: target.name, unit: sourceCode.getText(el), unitNode: el })
    }
    return bindings
  }

  if (argument.type === NodeType.ObjectExpression && call.id.type === NodeType.ObjectPattern) {
    const locals = new Map<string, Node.Identifier>()
    for (const prop of call.id.properties) {
      if (prop.type !== NodeType.Property || prop.computed) return null
      const name = keyName(prop.key)
      if (name === null || prop.value.type !== NodeType.Identifier) return null
      locals.set(name, prop.value)
    }

    const bindings: NormalizedBinding[] = []
    for (const prop of argument.properties) {
      if (prop.type !== NodeType.Property || prop.computed) return null
      const name = keyName(prop.key)
      if (name === null) return null
      const local = locals.get(name)
      if (!local) return null
      const value = prop.value as Node.Expression
      bindings.push({ local: local.name, unit: sourceCode.getText(value), unitNode: value })
    }
    return bindings
  }

  // plain non-destructuring call: const x = useUnit($unit)
  if (call.id.type === NodeType.Identifier) {
    if (argument.type === NodeType.ArrayExpression || argument.type === NodeType.ObjectExpression) return null
    return [{ local: call.id.name, unit: sourceCode.getText(argument), unitNode: argument }]
  }

  return null
}

/**
 * Builds the merged statement text. The target form follows the first array/object call,
 * so mixed forms collapse into the form the author started with; all-plain groups become
 * object form. Returns `null` when any call can't be normalized or two bindings share a
 * local name (which would generate invalid JS).
 */
function buildMergedText(calls: UseUnitCall[], sourceCode: SourceCode): string | null {
  const [first] = calls
  if (!first) return null

  const calleeName = first.init.callee.type === NodeType.Identifier ? first.init.callee.name : "useUnit"

  let targetForm: "array" | "object" = "object"
  for (const call of calls) {
    if (call.init.arguments[0]?.type === NodeType.ArrayExpression && call.id.type === NodeType.ArrayPattern) {
      targetForm = "array"
      break
    }
    if (call.init.arguments[0]?.type === NodeType.ObjectExpression && call.id.type === NodeType.ObjectPattern) {
      targetForm = "object"
      break
    }
  }

  const bindings: NormalizedBinding[] = []
  const seen = new Set<string>()
  for (const call of calls) {
    const extracted = extractBindings(call, sourceCode)
    if (!extracted) return null
    for (const binding of extracted) {
      if (seen.has(binding.local)) return null
      seen.add(binding.local)
      bindings.push(binding)
    }
  }

  if (targetForm === "array") {
    return `const [${bindings.map((b) => b.local).join(", ")}] = ${calleeName}([${bindings.map((b) => b.unit).join(", ")}])`
  }
  return `const { ${bindings.map((b) => b.local).join(", ")} } = ${calleeName}({ ${bindings.map((b) => `${b.local}: ${b.unit}`).join(", ")} })`
}

function collectBindings(calls: UseUnitCall[]): UnitBinding[] {
  const bindings: UnitBinding[] = []
  for (const call of calls) {
    for (const unitNode of unitExpressionNodes(call)) bindings.push({ call, unitNode })
  }
  return bindings
}

function groupBindingsByType(bindings: UnitBinding[], getNodeType: GetNodeType): Record<UnitType, UnitBinding[]> {
  const groups: Record<UnitType, UnitBinding[]> = { store: [], event: [], effect: [], unknown: [] }
  for (const binding of bindings) groups[getNodeType(binding.unitNode)].push(binding)
  return groups
}

function hasMixedTypes(call: UseUnitCall, getNodeType: GetNodeType): boolean {
  const types = new Set<UnitType>()
  for (const node of unitExpressionNodes(call)) {
    const type = getNodeType(node)
    if (type !== "unknown") types.add(type)
  }
  return types.size > 1
}

/**
 * Whether `exprNode` can be evaluated at `anchorStart` without hitting a temporal dead zone —
 * i.e. it references no variable declared at or after the anchor. Merging hoists every unit to
 * the anchor's position, so a unit depending on a later declaration (e.g. `useContext`) is unsafe.
 */
function isHoistable(exprNode: Node.Expression, anchorStart: number, sourceCode: SourceCode): boolean {
  const within = (node: Node.Node) => node.range[0] >= exprNode.range[0] && node.range[1] <= exprNode.range[1]

  const visit = (scope: Scope): boolean => {
    for (const reference of scope.references) {
      if (!within(reference.identifier)) continue
      const variable = reference.resolved
      if (!variable) continue
      for (const def of variable.defs) {
        if (def.node.range[0] >= anchorStart) return false
      }
    }
    return scope.childScopes.every(visit)
  }

  return visit(sourceCode.getScope(exprNode))
}

/**
 * The subset of calls that can be merged at the first call's position without a TDZ hazard.
 * Calls whose units depend on declarations between the anchor and themselves are dropped, so
 * legitimately ordered code (a unit acquired between two `useUnit` calls) is left untouched.
 */
function hoistableSubset(calls: UseUnitCall[], sourceCode: SourceCode): UseUnitCall[] {
  const [anchor, ...rest] = calls
  if (!anchor) return []

  const anchorStart = anchor.statement.range[0]
  const subset = [anchor]
  for (const call of rest) {
    if (unitExpressionNodes(call).every((node) => isHoistable(node, anchorStart, sourceCode))) subset.push(call)
  }
  return subset
}

function removeStatement(fixer: Fixer, sourceCode: SourceCode, statement: Node.VariableDeclaration): RuleFix {
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
  const text = buildMergedText(calls, sourceCode)
  if (text === null) return null

  const [first, ...rest] = calls
  if (!first) return null

  const fixes: RuleFix[] = [fixer.replaceText(first.statement, text)]
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

/**
 * Reports redundant `useUnit` calls in a group, attaching a merge suggestion when one is sound.
 * Calls that can't be hoisted to the first call are dropped from the group (left unreported), so
 * the rule stays silent on legitimately ordered code instead of suggesting broken fixes.
 */
function reportGroup(context: Context, calls: UseUnitCall[]): void {
  const sourceCode = context.sourceCode
  const group = hoistableSubset(calls, sourceCode)
  if (group.length <= 1) return

  const captured = [...group]
  const mergeable = buildMergedText(captured, sourceCode) !== null
  const [, ...rest] = captured
  for (const call of rest) {
    context.report({
      node: call.init,
      messageId: "multipleUseUnit",
      ...(mergeable
        ? {
            suggest: [
              {
                messageId: "multipleUseUnit",
                fix: (fixer) => generateMergeFix(fixer, captured, context),
              },
            ],
          }
        : {}),
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
        "Recommend combining multiple useUnit calls into a single call. The @@unitShape protocol and useUnit calls whose argument is not a unit are ignored.",
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
    const callsStack: UseUnitCall[][] = []

    const services = ESLintUtils.getParserServices(context)

    const getNodeType: GetNodeType = (node) => {
      const type = services.getTypeAtLocation(node)
      if (isType.store(type, services.program)) return "store"
      if (isType.event(type, services.program)) return "event"
      if (isType.effect(type, services.program)) return "effect"
      return "unknown"
    }

    const pushCall = (node: ShapeCall | ListCall | PlainCall): void => {
      const callee = node.init.callee
      if (callee.type !== NodeType.Identifier || !importedAs.has(callee.name)) return
      const current = callsStack.at(-1)
      if (!current) return
      current.push({ statement: node.parent, init: node.init, id: node.id })
    }

    const onFunctionExit = (): void => {
      const calls = callsStack.pop()
      if (!calls || calls.length === 0) return

      if (separation === "enforce") {
        for (const call of calls) {
          if (!hasMixedTypes(call, getNodeType)) continue
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
        return
      }

      if (calls.length <= 1) return

      if (separation === "allow") {
        const groups = groupBindingsByType(collectBindings(calls), getNodeType)
        for (const group of Object.values(groups)) {
          const groupCalls = [...new Set(group.map((b) => b.call))]
          if (groupCalls.length <= 1) continue
          reportGroup(context, groupCalls)
        }
        return
      }

      // separation === "forbid": all calls collapse into one regardless of form or type
      reportGroup(context, calls)
    }

    return {
      [selector.import]: (node: Node.ImportSpecifier) => void importedAs.add(node.local.name),

      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression": () => void callsStack.push([]),

      "FunctionDeclaration:exit": onFunctionExit,
      "FunctionExpression:exit": onFunctionExit,
      "ArrowFunctionExpression:exit": onFunctionExit,

      [`${selector.variable.shape}:has(> ${selector.call}:has(${selector.arg.shape}))`]: (node: ShapeCall) =>
        pushCall(node),

      [`${selector.variable.list}:has(> ${selector.call}:has(${selector.arg.list}))`]: (node: ListCall) =>
        pushCall(node),

      [`${selector.variable.plain}:has(> ${selector.call})`](node: PlainCall): void {
        if (node.init.arguments.length !== 1) return
        const arg = node.init.arguments[0]
        if (!arg || arg.type === NodeType.SpreadElement) return
        // Only non-destructuring calls over a single unit can be merged; a collection argument
        // (`useUnit([...])` / `useUnit({...})`) or a non-unit argument (e.g. @@unitShape) is ignored.
        if (arg.type === NodeType.ArrayExpression || arg.type === NodeType.ObjectExpression) return
        const callee = node.init.callee
        if (callee.type !== NodeType.Identifier || !importedAs.has(callee.name)) return
        if (getNodeType(arg) === "unknown") return
        pushCall(node)
      },
    }
  },
})
