import { type Symbol } from "typescript"

const createTypeCheck = (types: string[], from: string) => (symbol: Symbol) => {
  const name = symbol.getName()
  const declarations = symbol.declarations ?? []

  return (
    types.includes(name) &&
    declarations
      .map((decl) => decl.getSourceFile().fileName)
      .some((fname) => fname.includes("node_modules") && fname.includes(from))
  )
}

export const isType = {
  store: createTypeCheck(["Store", "StoreWritable"], "effector"),
  storeWriteable: createTypeCheck(["StoreWritable"], "effector"),

  event: createTypeCheck(["Event", "EventCallable"], "effector"),
  eventCallable: createTypeCheck(["EventCallable"], "effector"),

  effect: createTypeCheck(["Effect"], "effector"),

  unit: createTypeCheck(["Store", "StoreWritable", "Event", "EventCallable", "Effect"], "effector"),
}
