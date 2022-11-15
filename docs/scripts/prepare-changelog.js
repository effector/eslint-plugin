import { copyFile } from "node:fs/promises";

await copyFile("CHANGELOG.md", "docs/changelog.md");
