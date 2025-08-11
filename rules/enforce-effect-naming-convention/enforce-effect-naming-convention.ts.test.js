const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");

const rule = require("./enforce-effect-naming-convention");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx"],
      },
      tsconfigRootDir: join(__dirname, "../.."),
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("enforce-effect-naming-convention.ts.test", rule, {
  valid: ["correct-effect-naming.ts"].map(readExampleForTheRule),

  invalid: [
    // Errors
    ...["incorrect-effect-naming.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "invalidName",
            type: "VariableDeclarator",
            suggestions: [
              {
                messageId: "renameEffect",
                output: result.code.replace("justEffect", "justEffectFx"),
              },
            ],
          },
        ],
      })),
  ],
});
