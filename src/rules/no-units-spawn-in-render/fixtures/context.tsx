import { createStore } from "effector"
import { createContext } from "react"

const $store = createStore(0)

export const ModelContext = createContext({ $store })
