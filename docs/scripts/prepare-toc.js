import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// rules
const RULES_DIR = "docs/rules";

const rulesDocsDir = await readdir(RULES_DIR);

const rulesListMD = rulesDocsDir.filter(onlyRule).map(listElement).join("\n");

await writeFile(join(RULES_DIR, "__index.md"), rulesListMD);

// presets

const PRESETS_DIR = "docs/presets";

const presetDocsDir = await readdir(PRESETS_DIR);

const presetsListMD = presetDocsDir
  .filter(onlyRule)
  .map(listElement)
  .join("\n");

await writeFile(join(PRESETS_DIR, "__index.md"), presetsListMD);

// utils

function listElement(file) {
  return `- [${title(file)}](./${file})`;
}

function title(file) {
  return file.replace(".md", "");
}

function onlyRule(file) {
  return file !== "index.md" && !file.startsWith("__");
}
