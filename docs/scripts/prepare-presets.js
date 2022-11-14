import { writeFile } from "node:fs/promises";

import plugin from "../../index.js";

const presets = Object.entries(plugin.configs).map(([name, config]) => [
  name,
  Object.entries(config.rules)
    .filter(([_, ruleValue]) => ruleValue !== "off")
    .map(([ruleName]) => ruleName.replace("effector/", "")),
]);

for (const [presetName, rules] of presets) {
  const rulesListMD = rules.map(ruleLink).join("\n");

  await writeFile(`docs/presets/__${presetName}.md`, rulesListMD);
}

// utils

function ruleLink(name) {
  return `- [${name}](${ruleFile(name)})`;
}

function ruleFile(name) {
  return `/rules/${name}.md`;
}
