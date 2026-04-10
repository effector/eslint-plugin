import { getContextualType, typeMatchesSpecifier } from "@typescript-eslint/type-utils"
import { AST_NODE_TYPES, ESLintUtils, type TSESTree as ESNode } from "@typescript-eslint/utils"
import { type Program, type Node as TSNode, type Type, type TypeChecker, isExpression } from "typescript"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"
import { nameOf } from "@/shared/name"
import { PACKAGE_NAME } from "@/shared/package"

const EFFECTOR_FACTORIES = new Set([
  "createStore",
  "createEvent",
  "createEffect",
  "createDomain",
  "createApi",
  "restore",
])

const EFFECTOR_OPERATORS = new Set(["sample", "guard", "forward", "merge", "split", "combine", "attach"])

const REACT_HOOKS_SPEC = {
  from: "package" as const,
  package: "react",
  name: [
    "useState",
    "useEffect",
    "useLayoutEffect",
    "useCallback",
    "useMemo",
    "useRef",
    "useReducer",
    "useImperativeHandle",
    "useDebugValue",
    "useDeferredValue",
    "useTransition",
    "useId",
    "useSyncExternalStore",
    "useInsertionEffect",
    "useContext",
  ],
}

const EFFECTOR_FACTORY_SPEC = { from: "package" as const, package: "effector", name: [...EFFECTOR_FACTORIES] }
const EFFECTOR_OPERATOR_SPEC = { from: "package" as const, package: "effector", name: [...EFFECTOR_OPERATORS] }

// effector-factorio's `factory.useModel()` is a context-based hook (like useContext) that retrieves
// pre-created units — not a factory that spawns new ones. Exclude it from false-positive reports.
// We identify a factorio factory by the structural shape of the receiver object's type.
const EFFECTOR_FACTORIO_SHAPE = ["useModel", "createModel", "Provider", "@@unitShape"] as const

export default createRule({
  name: "no-units-spawn-in-render",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid creating Effector units or calling operators inside React components or hooks.",
    },
    messages: {
      noFactoryInRender:
        'Creating Effector units with "{{ name }}" inside React component or hook is forbidden. Units will be recreated on every render, which may cause memory leaks and other bugs.',
      noOperatorInRender:
        'Using Effector operator "{{ name }}" inside React component or hook is forbidden. Subscriptions will be recreated on every render.',
      noCustomFactoryInRender: `Creating Effector units with custom factory"{{ name }}" inside React component or hook is forbidden. Units will be recreated on every render, which may cause memory leaks and other bugs.`,
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    // Tracks whether each nested function scope is a render context (component/hook).
    // On function enter we push true/false, on exit we pop. Nested functions inherit: if the
    // parent is a render context, all children are too (e.g. callbacks inside a component).
    const stack = { render: [] as boolean[] }

    // Maps local names of effector imports to their kind, so we can report them without type analysis.
    // Populated from `import { createStore, sample } from "effector"` (handles renames too).
    const effectorImports = new Map<string, "factory" | "operator">()

    type ComponentFunction = ESNode.FunctionDeclaration | ESNode.FunctionExpression | ESNode.ArrowFunctionExpression

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME.core}]`

    return {
      // ── Phase 1: Collect effector imports ──────────────────────────────────

      [`${importSelector} > ImportSpecifier[imported.type="Identifier"]`]: (
        node: ESNode.ImportSpecifier & { imported: ESNode.Identifier },
      ) => {
        const imported = node.imported.name
        const local = node.local.name

        if (EFFECTOR_FACTORIES.has(imported)) {
          effectorImports.set(local, "factory")
        } else if (EFFECTOR_OPERATORS.has(imported)) {
          effectorImports.set(local, "operator")
        }
      },

      // ── Phase 2: Track render scope via function enter/exit ────────────────
      //
      // Determines if a function is a render context using a series of heuristics,
      // ordered from cheapest to most expensive:
      //   1. Inherit from parent — if already inside render, every nested scope is too
      //   2. Name check — `useXxx` convention means a custom hook
      //   3. Return type — if the function returns JSX, it's a component
      //   4. Contextual type — if the function is used where a component type is expected
      //      (e.g. React.memo, forwardRef), it's a component even without explicit annotation

      [`FunctionDeclaration, FunctionExpression, ArrowFunctionExpression`]: (node: ComponentFunction) => {
        const current = stack.render.at(-1) ?? false
        if (current) return void stack.render.push(true)

        const name = nameOf.function(node)
        if (name && UseRegex.test(name.name)) return void stack.render.push(true)

        const tsnode = services.esTreeNodeToTSNodeMap.get(node)

        const signature = checker.getSignatureFromDeclaration(tsnode)
        // Void is a safe fallback: if TS can't resolve a signature, it won't match JSX types,
        // so the function won't be misclassified as a component
        const returnType = signature ? checker.getReturnTypeOfSignature(signature) : checker.getVoidType()

        const isJSX = returnType.isUnion()
          ? returnType.types.some((type) => isType.jsx(type, services.program))
          : isType.jsx(returnType, services.program)

        if (isJSX) return void stack.render.push(true)

        const inferred = (isExpression(tsnode) && getContextualType(checker, tsnode)) || checker.getUnknownType()

        const isComponent = inferred.isUnion()
          ? inferred.types.some((type) => isType.component(type, services.program))
          : isType.component(inferred, services.program)

        if (isComponent) return void stack.render.push(true)

        return void stack.render.push(false)
      },

      [`:matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression):exit`]: () =>
        void stack.render.pop(),

      // Class bodies are never render contexts themselves — class methods (like render())
      // will get their own stack entry and be evaluated independently.
      "ClassDeclaration": () => void stack.render.push(false),
      "ClassDeclaration:exit": () => void stack.render.pop(),

      // ── Phase 3: Flag violating calls inside render ────────────────────────
      //
      // Detection is done in two tiers, ordered so we can avoid expensive type
      // analysis when possible and catch operators whose return type is not a unit:
      //
      //   Tier 1 — Import-based (no type analysis):
      //     If the callee was imported from effector (tracked in Phase 1), we know
      //     its kind immediately. This is essential for operators like `forward`
      //     and `guard` that return Subscription instead of a unit.
      //
      //   Tier 2 — Type-based (requires type checker):
      //     For everything else, check if the call's return type contains effector
      //     units. If it does, classify the callee via typeMatchesSpecifier:
      //     - Known React hooks are excluded to avoid double-reporting: e.g.
      //       `useMemo(() => createStore(0), [])` returns Store, but the inner
      //       `createStore` and the like is already flagged — reporting `useMemo` too would be noise.
      //       `useContext` is excluded because it legitimately retrieves pre-created units.
      //     - effector-factorio's `factory.useModel()` is excluded — it retrieves
      //       pre-created units from React context, similar to useContext
      //     - Namespaced effector calls (e.g. `effector.createStore`) are matched
      //       by callee type against the effector package
      //     - Anything remaining is treated as a custom factory

      "CallExpression": (node: ESNode.CallExpression) => {
        const isWithinRender = stack.render.at(-1) ?? false
        if (!isWithinRender) return

        const calleeName = getCalleeName(node.callee)

        // Tier 1: known effector import — report immediately, skip type analysis
        const importType = calleeName ? effectorImports.get(calleeName) : undefined
        switch (importType) {
          case "factory":
            return context.report({ node, messageId: "noFactoryInRender", data: { name: calleeName } })
          case "operator":
            return context.report({ node, messageId: "noOperatorInRender", data: { name: calleeName } })
        }

        // Tier 2: return type contains effector units — classify via callee type
        const returnType = services.getTypeAtLocation(node)
        const ctx: TraverseCtx = { node: services.esTreeNodeToTSNodeMap.get(node), checker, program: services.program }

        if (!hasEffectorUnitInType(ctx, returnType)) return

        const calleeType = services.getTypeAtLocation(node.callee)
        const displayName = calleeName ?? "<expression>"

        if (typeMatchesSpecifier(calleeType, REACT_HOOKS_SPEC, services.program)) return
        if (isEffectorFactorioHook(node.callee, services.getTypeAtLocation)) return

        if (typeMatchesSpecifier(calleeType, EFFECTOR_FACTORY_SPEC, services.program))
          return context.report({ node, messageId: "noFactoryInRender", data: { name: displayName } })

        if (typeMatchesSpecifier(calleeType, EFFECTOR_OPERATOR_SPEC, services.program))
          return context.report({ node, messageId: "noOperatorInRender", data: { name: displayName } })

        context.report({ node, messageId: "noCustomFactoryInRender", data: { name: displayName } })
      },
    }
  },
})

const UseRegex = /^use[A-Z0-9].*$/

function getCalleeName(callee: ESNode.Expression): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (callee.type === AST_NODE_TYPES.MemberExpression && callee.property.type === AST_NODE_TYPES.Identifier)
    return callee.property.name
  else return null
}

type TraverseCtx = { node: TSNode; checker: TypeChecker; program: Program }

// Walks the type structure up to `depth` levels of object nesting to find effector units.
// Unions don't consume depth — they are alternative shapes at the same level.
function hasEffectorUnitInType(ctx: TraverseCtx, type: Type, depth = 3): boolean {
  if (isType.unit(type, ctx.program)) return true
  if (depth <= 0) return false

  // For unions, getProperties() only returns common properties across all members.
  // We must recurse into each member to check their individual properties for userland factories.
  if (type.isUnion()) return type.types.some((type) => hasEffectorUnitInType(ctx, type, depth))

  for (const property of type.getProperties()) {
    const type = ctx.checker.getTypeOfSymbolAtLocation(property, ctx.node)
    if (hasEffectorUnitInType(ctx, type, depth - 1)) return true
  }

  return false
}

// Checks if the callee is a method call on an effector-factorio factory object (e.g. `factory.useModel()`).
// Matches by structural shape of the receiver: must have useModel, createModel, Provider, and @@unitShape.
function isEffectorFactorioHook(callee: ESNode.Expression, getTypeAtLocation: (node: ESNode.Node) => Type): boolean {
  if (callee.type !== AST_NODE_TYPES.MemberExpression) return false

  const objectType = getTypeAtLocation(callee.object)
  const propertyNames = new Set(objectType.getProperties().map((p) => p.getName()))

  return EFFECTOR_FACTORIO_SHAPE.every((name) => propertyNames.has(name))
}
