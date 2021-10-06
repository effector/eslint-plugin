const plugin = require("./index");
const { createLinkToRule } = require("./utils/create-link-to-rule");

describe("plugin", () => {
  test("any rule should have a link to docs", () => {
    const { rules } = plugin;

    Object.entries(rules).forEach(([name, rule]) => {
      expect(rule.meta.docs.url).toBe(createLinkToRule(name));
    });
  });
});
