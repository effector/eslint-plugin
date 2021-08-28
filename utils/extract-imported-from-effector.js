function extractImportedFromEffector(importedFromEffector, node) {
  if (node.source.value === "effector") {
    for (const s of node.specifiers) {
      importedFromEffector.set(s.imported.name, s.local.name);
    }
  }
}
module.exports = { extractImportedFromEffector };
