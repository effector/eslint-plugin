import { type TypeOrValueSpecifier, typeMatchesSpecifier } from "@typescript-eslint/type-utils"
import { type Program, type Symbol, type Type } from "typescript"

const check = (symbol: Symbol, types: string[], from: string) => {
  const name = symbol.getName()
  const declarations = symbol.declarations ?? []

  return (
    types.includes(name) &&
    declarations
      .map((decl) => decl.getSourceFile().fileName)
      .some((fname) => fname.includes("node_modules") && fname.includes(from))
  )
}

const match = (type: Type, specifier: TypeOrValueSpecifier, program: Program) =>
  typeMatchesSpecifier(program.getTypeChecker().getNonNullableType(type), specifier, program)

export const isType = {
  store: (type: Type, program: Program) =>
    match(type, { from: "package", package: "effector", name: ["Store", "StoreWritable"] }, program),

  event: (type: Type, program: Program) =>
    match(type, { from: "package", package: "effector", name: ["Event", "EventCallable"] }, program),

  effect: (type: Type, program: Program) =>
    match(type, { from: "package", package: "effector", name: "Effect" }, program),

  domain: (type: Type, program: Program) =>
    match(type, { from: "package", package: "effector", name: "Domain" }, program),

  unit: (type: Type, program: Program) => {
    const name = ["Store", "StoreWritable", "Event", "EventCallable", "Effect", "Domain"]
    return match(type, { from: "package", package: "effector", name }, program)
  },

  // Gate is an intersection type, which TypeScript erases from existence
  gate: (type: Type, program: Program) => {
    const underlying = program.getTypeChecker().getNonNullableType(type)
    const symbol = underlying.getSymbol() ?? underlying.aliasSymbol
    return symbol ? check(symbol, ["Gate"], "effector") : false
  },

  jsx: (type: Type, program: Program) => {
    const name = ["Element", "ReactNode", "ReactElement"]
    return match(type, { from: "package", package: "react", name }, program)
  },

  component: (type: Type, program: Program) => {
    const name = ["FC", "FunctionComponent", "ComponentType", "ComponentClass", "ForwardRefRenderFunction"]
    return match(type, { from: "package", package: "react", name }, program)
  },
}
