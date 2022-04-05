const { readFile, readdir } = require("fs/promises");
const { join } = require("path");

const plugin = require("./index");

describe("docs", () => {
  test("any rule should have valid doc.md", async () => {
    await Promise.all([
      Object.entries(plugin.rules).map(async ([ruleName]) => {
        const ruleFiles = await readdir(join(__dirname, "rules", ruleName));

        // File exists
        expect(ruleFiles).toContain(`${ruleName}.md`);

        const ruleDocFile = await readFile(
          join(__dirname, "rules", ruleName, `${ruleName}.md`),
          "utf8"
        );

        // File has valid title
        expect(ruleDocFile).toContain(`effector/${ruleName}`);
      }),
    ]);
  });

  test("any rule should have like in main README.md", async () => {
    const readmeContent = await readFile(join(__dirname, "README.md"), "utf8");

    await Promise.all([
      Object.entries(plugin.rules).map(async ([ruleName]) => {
        // Link exists
        expect(readmeContent).toContain(
          `- [effector/${ruleName}](rules/${ruleName}/${ruleName}.md)`
        );
      }),
    ]);
  });

  test("any config should be presented in main README.md", async () => {
    const readmeContent = await readFile(join(__dirname, "README.md"), "utf8");

    await Promise.all([
      Object.entries(plugin.configs).map(async ([configName]) => {
        expect(readmeContent).toContain(`#### plugin:effector/${configName}`);
      }),
    ]);
  });

  test("any config should have list of rules in main README.md", async () => {
    const readmeContent = await readFile(join(__dirname, "README.md"), "utf8");

    await Promise.all([
      Object.entries(plugin.configs).map(async ([configName, config]) => {
        const [_, readmeContentAfterConfigDocSectionStart] =
          readmeContent.split(`#### plugin:effector/${configName}`);

        const [readmeContentConfigDocSection] =
          readmeContentAfterConfigDocSectionStart.split("###");

        const includedRuleNames = Object.keys(config.rules).map((fullName) =>
          fullName.replace("effector/", "")
        );

        const excludedRules = Object.keys(plugin.rules).filter(
          (rule) => !includedRuleNames.includes(rule)
        );

        // Has links to included rules
        for (const ruleName of includedRuleNames) {
          expect(readmeContentConfigDocSection).toContain(
            `- [effector/${ruleName}](rules/${ruleName}/${ruleName}.md)`
          );
        }

        // Does not have links to excluded rules
        for (const ruleName of excludedRules) {
          expect(readmeContentConfigDocSection).not.toContain(
            `- [effector/${ruleName}](rules/${ruleName}/${ruleName}.md)`
          );
        }
      }),
    ]);
  });
});
