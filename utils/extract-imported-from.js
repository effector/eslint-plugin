function extractImportedFrom({ importMap, node, libraryName }) {
  if (node.source.value === libraryName) {
    for (const s of node.specifiers) {
      importMap.set(s.imported.name, s.local.name);
    }
  }
}
module.exports = { extractImportedFrom };
