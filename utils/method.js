function isSomeMethod(methodName, { node, importMap }) {
  const normalizedMethodNames = Array.isArray(methodName)
    ? methodName
    : [methodName];

  return normalizedMethodNames.some((method) => {
    const localMethod = importMap.get(method);
    if (!localMethod) {
      return false;
    }

    const isEffectorMethod = node?.callee?.name === localMethod;

    return isEffectorMethod;
  });
}

const method = {
  is: (...args) => isSomeMethod(...args),
  isNot: (...args) => !isSomeMethod(...args),
};

module.exports = { method };
