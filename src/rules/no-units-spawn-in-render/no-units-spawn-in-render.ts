import { getContextualType, typeMatchesSpecifier } from "@typescript-eslint/type-utils"
import { AST_NODE_TYPES, ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"
import { type Program, type Type, type TypeChecker, isExpression } from "typescript"

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

export default createRule({
  name: "no-units-spawn-in-render",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid creating Effector units or calling operators inside React components or hooks.",
    },
    messages: {
      noFactoryInRender:
        'Creating Effector units with "{{ name }}" inside React component or hook is forbidden. Units will be recreated on every render.',
      noOperatorInRender:
        'Using Effector operator "{{ name }}" inside React component or hook is forbidden. Subscriptions will be recreated on every render.',
      noCustomFactoryInRender:
        'Calling "{{ name }}" that returns Effector units inside React component or hook is forbidden. Units will be recreated on every render.',
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

    type ComponentFunction = Node.FunctionDeclaration | Node.FunctionExpression | Node.ArrowFunctionExpression

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME.core}]`

    return {
      // ── Phase 1: Collect effector imports ──────────────────────────────────

      [`${importSelector} > ImportSpecifier[imported.type="Identifier"]`]: (
        node: Node.ImportSpecifier & { imported: Node.Identifier },
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
      //     - Namespaced effector calls (e.g. `effector.createStore`) are matched
      //       by callee type against the effector package
      //     - Anything remaining is treated as a custom factory

      "CallExpression": (node: Node.CallExpression) => {
        const isWithinRender = stack.render.at(-1) ?? false
        if (!isWithinRender) return

        const calleeName = getCalleeName(node.callee)

        // Tier 1: known effector import — report immediately, skip type analysis
        const importType = calleeName ? effectorImports.get(calleeName) : undefined
        if (importType === "factory") {
          context.report({ node, messageId: "noFactoryInRender", data: { name: calleeName } })
          return
        }
        if (importType === "operator") {
          context.report({ node, messageId: "noOperatorInRender", data: { name: calleeName } })
          return
        }

        // Tier 2: return type contains effector units — classify via callee type
        const returnType = services.getTypeAtLocation(node)
        if (!hasEffectorUnitInType(returnType, checker, services.program)) return

        const calleeType = services.getTypeAtLocation(node.callee)
        if (typeMatchesSpecifier(calleeType, REACT_HOOKS_SPEC, services.program)) return

        if (typeMatchesSpecifier(calleeType, EFFECTOR_FACTORY_SPEC, services.program)) {
          context.report({ node, messageId: "noFactoryInRender", data: { name: calleeName ?? "<expression>" } })
          return
        }
        if (typeMatchesSpecifier(calleeType, EFFECTOR_OPERATOR_SPEC, services.program)) {
          context.report({ node, messageId: "noOperatorInRender", data: { name: calleeName ?? "<expression>" } })
          return
        }

        context.report({
          node,
          messageId: "noCustomFactoryInRender",
          data: { name: calleeName ?? "<expression>" },
        })
      },
    }
  },
})

const UseRegex = /^use[A-Z0-9].*$/

function getCalleeName(callee: Node.CallExpression["callee"]): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (callee.type === AST_NODE_TYPES.MemberExpression && callee.property.type === AST_NODE_TYPES.Identifier) {
    return callee.property.name
  }
  return null
}

// Walks the type structure up to `depth` levels of object nesting to find effector units.
// Unions don't consume depth — they are alternative shapes at the same level.
function hasEffectorUnitInType(type: Type, checker: TypeChecker, program: Program, depth = 3): boolean {
  if (isType.unit(type, program) || isType.domain(type, program)) return true
  if (depth <= 0) return false

  // For unions, getProperties() only returns common properties across all members.
  // We must recurse into each member to check their individual properties for userland factories.
  if (type.isUnion()) {
    return type.types.some((t) => hasEffectorUnitInType(t, checker, program, depth))
  }

  const properties = type.getProperties()
  for (const prop of properties) {
    const firstDeclaration = prop.declarations?.[0]
    const propType = firstDeclaration
      ? checker.getTypeOfSymbolAtLocation(prop, firstDeclaration)
      : checker.getTypeOfSymbol(prop)
    if (hasEffectorUnitInType(propType, checker, program, depth - 1)) return true
  }

  return false
}
