const { readdir } = require("fs/promises");
const { join } = require("path");

const plugin = require("./index");
const { createLinkToRule } = require("./utils/create-link-to-rule");

describe("plugin", () => {
  test("any rule should have a link to docs", () => {
    const { rules } = plugin;

    Object.entries(rules).forEach(([name, rule]) => {
      expect(rule.meta.docs.url).toBe(createLinkToRule(name));
    });
  });

  test("any rule should be exported", async () => {
    const rulesDirContent = await readdir(join(__dirname, "rules"));

    const allRules = rulesDirContent
      .filter((fileName) => !fileName.includes(".json"))
      .sort();

    const exportedRules = Object.entries(plugin.rules)
      .map(([name]) => name)
      .sort();

    expect(exportedRules).toEqual(allRules);
  });

  test("any config should be exported", async () => {
    const configsDirContent = await readdir(join(__dirname, "config"));

    const allConfigs = configsDirContent
      .map((fileName) => fileName.replace(".js", ""))
      .sort();

    const exportedConfigs = Object.entries(plugin.configs)
      .map(([name]) => name)
      .sort();

    expect(exportedConfigs).toEqual(allConfigs);
  });
});
