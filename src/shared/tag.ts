export const ts = (code: TemplateStringsArray, ...insert: string[]) => String.raw({ raw: code.raw }, ...insert)
export const tsx = (code: TemplateStringsArray, ...insert: string[]) => String.raw({ raw: code.raw }, ...insert)
