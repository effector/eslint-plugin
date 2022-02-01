function extractImportedFrom({ importMap, nodeMap, node, packageName }) {
  if (node.source.value === packageName) {
    for (const s of node.specifiers) {
      importMap.set(s.imported.name, s.local.name);
      nodeMap?.set(s.imported.name, s);
    }
  }
}

module.exports = { extractImportedFrom };
