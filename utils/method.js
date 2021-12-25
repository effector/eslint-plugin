function isMethod({ node, method, importMap }) {
  const localMethod = importMap.get(method);
  if (!localMethod) {
    return false;
  }

  const isEffectorMethod = node?.callee?.name === localMethod;

  return isEffectorMethod;
}

module.exports = { isMethod };
