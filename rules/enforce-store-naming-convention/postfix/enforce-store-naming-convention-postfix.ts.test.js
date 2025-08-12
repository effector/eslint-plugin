const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../../utils/read-example");

const rule = require("../enforce-store-naming-convention");

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
  settings: {
    effector: {
      storeNameConvention: "postfix",
    },
  },
});

ruleTester.run(
  "enforce-store-naming-convention-postfix.ts.test",
  rule,
  {
    valid: ["correct-store-naming.ts"].map(readExampleForTheRule),

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
                  output: result.code.replace("justStore", "justStore$"),
                },
              ],
            },
          ],
        })),
    ],
  }
);
