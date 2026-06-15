import { ESLintUtils, type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"
import type { RuleContext, RuleFix, RuleFixer, Scope, SourceCode } from "@typescript-eslint/utils/ts-eslint"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"
import { PACKAGE_NAME } from "@/shared/package"

type MessageIds = "multipleUseUnit" | "mixedStoresAndEvents"
type Options = [{ separation?: "forbid" | "allow" | "enforce" }?]
type Context = RuleContext<MessageIds, Options>
type UnitType = "store" | "event" | "effect" | "unknown"
type GetNodeType = (node: Node.Node) => UnitType
type Form = "array" | "object" | "plain"

/** The rule's primitive: a component-scope identifier bound to the unit expression passed to `useUnit`. */
type Binding = { unit: Node.Expression; boundTo: Node.Identifier }

type UseUnitCall = {
  /** the enclosing statement, replaced/removed when fixing */
  declaration: Node.VariableDeclaration
  /** the `useUnit(...)` call, used as the report location */
  report: Node.CallExpression
  callee: string
  form: Form
  /** every unit expression in the call (always complete, even when `normalized` is false) */
  units: Node.Expression[]
  /** identifier ↔ unit pairs; complete and lossless only when `normalized` */
  bindings: Binding[]
  /** `bindings` losslessly represent the destructuring (no holes, rest, defaults, computed or duplicate keys) */
  normalized: boolean
  /** safe to rewrite the statement: a sole `const` declarator without a type annotation */
  fixable: boolean
}

const selectorImport = `ImportDeclaration[source.value=${PACKAGE_NAME.react}] > ImportSpecifier[imported.name=useUnit]`
const selectorCall = "VariableDeclarator:has(> CallExpression.init[arguments.length=1][callee.type=Identifier])"

function keyName(key: Node.Property["key"]): string | null {
  if (key.type === NodeType.Identifier) return key.name
  if (key.type === NodeType.Literal) return String(key.value)
  return null
}

type Analysis = { form: Form; units: Node.Expression[]; bindings: Binding[]; normalized: boolean }

/**
 * Walks a `useUnit` declarator once and normalizes it. `units` lists every unit expression; `bindings`
 * pairs each with its destructured identifier. `normalized` is false when the destructuring can't be
 * losslessly rebuilt — holes, rest/spread, defaults, computed or duplicate keys, nested patterns, or a
 * non-destructuring call over a collection. Returns null when the declarator isn't a useUnit form we handle.
 */
function analyze(declarator: Node.VariableDeclarator): Analysis | null {
  const init = declarator.init
  if (init?.type !== NodeType.CallExpression) return null
  const argument = init.arguments[0]
  if (!argument || argument.type === NodeType.SpreadElement) return null
  const id = declarator.id

  if (id.type === NodeType.ArrayPattern && argument.type === NodeType.ArrayExpression) {
    const units: Node.Expression[] = []
    const bindings: Binding[] = []
    let normalized = argument.elements.length === id.elements.length

    argument.elements.forEach((element, index) => {
      if (!element || element.type === NodeType.SpreadElement) {
        normalized = false
        return
      }
      units.push(element)
      const target = id.elements[index]
      if (target?.type === NodeType.Identifier) bindings.push({ unit: element, boundTo: target })
      else normalized = false
    })

    return { form: "array", units, bindings, normalized }
  }

  if (id.type === NodeType.ObjectPattern && argument.type === NodeType.ObjectExpression) {
    const localByKey = new Map<string, Node.Identifier>()
    let normalized = true

    for (const property of id.properties) {
      if (property.type !== NodeType.Property || property.computed) {
        normalized = false
        continue
      }
      const key = keyName(property.key)
      if (key === null || property.value.type !== NodeType.Identifier) {
        normalized = false
        continue
      }
      if (localByKey.has(key)) normalized = false // e.g. const { value: x, value: y } = useUnit({ value: $ })
      localByKey.set(key, property.value)
    }

    const units: Node.Expression[] = []
    const bindings: Binding[] = []

    for (const property of argument.properties) {
      if (property.type !== NodeType.Property || property.computed) {
        normalized = false
        continue
      }
      // Property values inside an ObjectExpression are expressions at runtime; exclude the pattern
      // members the shared `Property` type carries so `value` narrows to Expression without a cast.
      const value = property.value
      if (
        value.type === NodeType.AssignmentPattern ||
        value.type === NodeType.ArrayPattern ||
        value.type === NodeType.ObjectPattern ||
        value.type === NodeType.TSEmptyBodyFunctionExpression
      ) {
        normalized = false
        continue
      }
      units.push(value)
      const key = keyName(property.key)
      const local = key === null ? undefined : localByKey.get(key)
      if (local) bindings.push({ unit: value, boundTo: local })
      else normalized = false
    }

    return { form: "object", units, bindings, normalized }
  }

  // non-destructuring call: const x = useUnit($unit)
  if (id.type === NodeType.Identifier) {
    if (argument.type === NodeType.ArrayExpression || argument.type === NodeType.ObjectExpression) return null
    return { form: "plain", units: [argument], bindings: [{ unit: argument, boundTo: id }], normalized: true }
  }

  return null
}

/**
 * Distinct unit type of a call: "mixed" when it spans several known types; "unknown" when any unit's
 * type is undetermined (so it's never merged or split — we must not guess at an unknown unit).
 */
function classify(call: UseUnitCall, getNodeType: GetNodeType): UnitType | "mixed" {
  const types = new Set(call.units.map(getNodeType))
  const known = [...types].filter((type) => type !== "unknown")
  if (known.length > 1) return "mixed"
  if (known.length === 1 && !types.has("unknown")) return known[0]!
  return "unknown"
}

/**
 * Whether `unit` references a variable declared inside the enclosing component at or after `anchorStart`.
 * Merging hoists every unit to the anchor's position, so such a reference would hit a temporal dead zone.
 * Variables from outer scopes (module units, imports, params) are always initialized by render time and safe.
 */
function dependsOnLaterLocal(unit: Node.Expression, anchorStart: number, functionEnd: number, sourceCode: SourceCode) {
  const within = (node: Node.Node) => node.range[0] >= unit.range[0] && node.range[1] <= unit.range[1]

  const visit = (scope: Scope.Scope): boolean => {
    for (const reference of scope.references) {
      if (!within(reference.identifier)) continue
      const defs = reference.resolved?.defs ?? []
      if (defs.some((def) => def.node.range[0] >= anchorStart && def.node.range[1] <= functionEnd)) return true
    }
    return scope.childScopes.some(visit)
  }

  return visit(sourceCode.getScope(unit))
}

/** Renders one `useUnit` statement from a set of bindings in the given form. */
function lineFor(form: Form, bindings: Binding[], callee: string, sourceCode: SourceCode): string {
  const names = bindings.map((binding) => sourceCode.getText(binding.boundTo))
  if (form === "array") {
    const units = bindings.map((binding) => sourceCode.getText(binding.unit))
    return `const [${names.join(", ")}] = ${callee}([${units.join(", ")}])`
  }
  const properties = bindings.map(
    (binding) => `${sourceCode.getText(binding.boundTo)}: ${sourceCode.getText(binding.unit)}`,
  )
  return `const { ${names.join(", ")} } = ${callee}({ ${properties.join(", ")} })`
}

/** The form a merged group collapses into: the first array/object call, or object form for all-plain groups. */
function targetForm(group: UseUnitCall[]): Form {
  for (const call of group) if (call.form !== "plain") return call.form
  return "object"
}

function indentOf(statement: Node.VariableDeclaration, sourceCode: SourceCode): string {
  const lineStart = sourceCode.text.lastIndexOf("\n", statement.range[0] - 1) + 1
  return sourceCode.text.slice(lineStart, statement.range[0])
}

function removeStatement(fixer: RuleFixer, sourceCode: SourceCode, statement: Node.VariableDeclaration): RuleFix {
  let start = statement.range[0]
  const lineStart = sourceCode.text.lastIndexOf("\n", start - 1) + 1
  if (/^\s*$/.test(sourceCode.text.slice(lineStart, start))) start = lineStart

  const end = statement.range[1]
  const nextChar = sourceCode.text[end]
  return fixer.removeRange([start, nextChar === "\n" || nextChar === "\r" ? end + 1 : end])
}

function mergeFix(fixer: RuleFixer, group: UseUnitCall[], sourceCode: SourceCode): RuleFix[] {
  const [anchor, ...rest] = group
  const bindings = group.flatMap((call) => call.bindings)
  const fixes = [
    fixer.replaceText(anchor!.declaration, lineFor(targetForm(group), bindings, anchor!.callee, sourceCode)),
  ]
  for (const call of rest) fixes.push(removeStatement(fixer, sourceCode, call.declaration))
  return fixes
}

function splitFix(fixer: RuleFixer, call: UseUnitCall, sourceCode: SourceCode, getNodeType: GetNodeType): RuleFix[] {
  const order: UnitType[] = ["store", "event", "effect", "unknown"]
  const byType = new Map<UnitType, Binding[]>()
  for (const binding of call.bindings) {
    const type = getNodeType(binding.unit)
    const group = byType.get(type) ?? byType.set(type, []).get(type)!
    group.push(binding)
  }

  const indent = indentOf(call.declaration, sourceCode)
  const lines = order
    .filter((type) => byType.has(type))
    .map((type) => lineFor(call.form, byType.get(type)!, call.callee, sourceCode))

  return [fixer.replaceText(call.declaration, lines.join(`\n${indent}`))]
}

/** Names bound across the group are unique, so a merged destructuring stays valid JS. */
function hasUniqueNames(group: UseUnitCall[]): boolean {
  const names = group.flatMap((call) => call.bindings.map((binding) => binding.boundTo.name))
  return new Set(names).size === names.length
}

/**
 * Reports redundant `useUnit` calls that should collapse into one. Calls whose units depend on a
 * declaration between the anchor and themselves can't be hoisted, so they start a fresh group instead —
 * leaving legitimately ordered code untouched while still surfacing mergeable calls further down.
 */
function reportMerge(context: Context, candidates: UseUnitCall[], functionEnd: number): void {
  const sourceCode = context.sourceCode
  let pool = candidates

  while (pool.length > 1) {
    const [anchor, ...rest] = pool
    const anchorStart = anchor!.declaration.range[0]
    const group = [anchor!]
    const leftover: UseUnitCall[] = []

    for (const call of rest) {
      const hoistable = call.units.every((unit) => !dependsOnLaterLocal(unit, anchorStart, functionEnd, sourceCode))
      ;(hoistable ? group : leftover).push(call)
    }

    if (group.length > 1) {
      const mergeable = group.every((call) => call.normalized && call.fixable) && hasUniqueNames(group)
      for (const call of group.slice(1)) {
        context.report({
          node: call.report,
          messageId: "multipleUseUnit",
          suggest: mergeable
            ? [{ messageId: "multipleUseUnit", fix: (fixer) => mergeFix(fixer, group, sourceCode) }]
            : undefined,
        })
      }
    }

    pool = leftover
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
          separation: { type: "string", enum: ["forbid", "allow", "enforce"], default: "forbid" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create(context) {
    const importedAs = new Set<string>()
    const separation = context.options[0]?.separation ?? "forbid"
    const stack: { calls: UseUnitCall[]; functionEnd: number }[] = []

    const services = ESLintUtils.getParserServices(context)
    const getNodeType: GetNodeType = (node) => {
      const type = services.getTypeAtLocation(node)
      if (isType.store(type, services.program)) return "store"
      if (isType.event(type, services.program)) return "event"
      if (isType.effect(type, services.program)) return "effect"
      return "unknown"
    }

    const onFunctionExit = (): void => {
      const frame = stack.pop()
      if (!frame || frame.calls.length === 0) return
      const { calls, functionEnd } = frame

      if (separation === "forbid") {
        reportMerge(context, calls, functionEnd)
        return
      }

      // allow & enforce both merge same-type calls; enforce additionally splits mixed ones.
      const byType: Record<"store" | "event" | "effect", UseUnitCall[]> = { store: [], event: [], effect: [] }
      for (const call of calls) {
        const type = classify(call, getNodeType)
        if (type !== "mixed" && type !== "unknown") byType[type].push(call)
      }
      for (const group of Object.values(byType)) reportMerge(context, group, functionEnd)

      if (separation === "enforce") {
        for (const call of calls) {
          if (classify(call, getNodeType) !== "mixed") continue
          context.report({
            node: call.report,
            messageId: "mixedStoresAndEvents",
            suggest:
              call.normalized && call.fixable
                ? [
                    {
                      messageId: "mixedStoresAndEvents",
                      fix: (fixer) => splitFix(fixer, call, context.sourceCode, getNodeType),
                    },
                  ]
                : undefined,
          })
        }
      }
    }

    return {
      [selectorImport]: (node: Node.ImportSpecifier) => void importedAs.add(node.local.name),

      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression": (node: Node.FunctionLike) =>
        void stack.push({ calls: [], functionEnd: node.range[1] }),

      "FunctionDeclaration:exit": onFunctionExit,
      "FunctionExpression:exit": onFunctionExit,
      "ArrowFunctionExpression:exit": onFunctionExit,

      [selectorCall](node: Node.VariableDeclarator): void {
        const init = node.init
        if (init?.type !== NodeType.CallExpression) return
        const callee = init.callee
        if (callee.type !== NodeType.Identifier || !importedAs.has(callee.name)) return
        if (node.parent.type !== NodeType.VariableDeclaration) return

        // A non-destructuring call is only relevant when its single argument is a unit; this drops
        // `useUnit(model)` (@@unitShape), `useUnit(notAUnit)` and `useUnit([...])` over a collection.
        if (node.id.type === NodeType.Identifier) {
          const argument = init.arguments[0]
          if (!argument || argument.type === NodeType.SpreadElement || getNodeType(argument) === "unknown") return
        }

        const analysis = analyze(node)
        if (!analysis) return

        const declaration = node.parent
        const fixable = declaration.kind === "const" && declaration.declarations.length === 1 && !node.id.typeAnnotation

        stack.at(-1)?.calls.push({ declaration, report: init, callee: callee.name, fixable, ...analysis })
      },
    }
  },
})
