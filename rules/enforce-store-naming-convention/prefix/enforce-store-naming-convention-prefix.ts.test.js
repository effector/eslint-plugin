const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../../utils/read-example");

const rule = require("../enforce-store-naming-convention");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx"],
      },
      tsconfigRootDir: join(__dirname, "../../.."),
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run(
  "enforce-store-naming-convention-prefix.ts.test",
  rule,
  {
    valid: ["correct-store-naming.ts", "correct-issue-139.ts"].map(
      readExampleForTheRule
    ),

    invalid: [
      // Errors
      ...["incorrect-store-naming.ts"]
        .map(readExampleForTheRule)
        .map((result) => ({
          ...result,
          errors: [
            {
              messageId: "invalidName",
              type: "VariableDeclarator",
              suggestions: [
                {
                  messageId: "renameStore",
                  output: result.code.replace("justStore", "$justStore"),
                },
              ],
            },
          ],
        })),
    ],
  }
);
