function extractImportedFrom({ importMap, node, packageName }) {
  if (node.source.value === packageName) {
    for (const s of node.specifiers) {
      importMap.set(s.imported.name, s.local.name);
    }
  }
}

module.exports = { extractImportedFrom };
