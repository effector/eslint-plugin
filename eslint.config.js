import js from "@eslint/js"
import ts from "typescript-eslint"
import prettier from "eslint-plugin-prettier/recommended"
import imports from "eslint-plugin-import-x"

/** @type {import('typescript-eslint').Config} */
const config = [
  { ignores: ["dist", "docs"] },
  { ignores: ["eslint.config.js", "vitest.config.ts", "tsdown.config.ts"] },

  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,

  { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },

  imports.flatConfigs.recommended,
  imports.flatConfigs.typescript,

  prettier,

  {
    rules: {
      "sort-imports": ["warn", { allowSeparatedGroups: true, ignoreDeclarationSort: true }],

      "import-x/no-default-export": "error",
      "import-x/no-duplicates": ["error", { "prefer-inline": true }],
      "import-x/newline-after-import": "error",
      "import-x/no-named-as-default-member": "off",

      "import-x/order": [
        "error",
        {
          "newlines-between": "always",
          "groups": ["builtin", "external", "internal", "parent", "sibling"],
          "pathGroupsExcludedImportTypes": [],
          "alphabetize": { order: "asc", orderImportKind: "desc", caseInsensitive: true },
        },
      ],
    },
  },

  {
    files: ["src/index.ts", "src/rules/*/*.ts"],
    rules: { "import-x/no-default-export": "off", "import-x/prefer-default-export": "error" },
  },
]

export default config
