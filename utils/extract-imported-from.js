function extractImportedFrom({ importMap, nodeMap, node, packageName }) {
  const normalizePackageName = Array.isArray(packageName)
    ? packageName
    : [packageName];

  if (normalizePackageName.includes(node.source.value)) {
    for (const s of node.specifiers) {
      if (s.type === "ImportDefaultSpecifier") {
        continue;
      }

      importMap.set(s.imported.name, s.local.name);
      nodeMap?.set(s.imported.name, s);
    }
  }
}

module.exports = { extractImportedFrom };
