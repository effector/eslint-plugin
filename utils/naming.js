const { getStoreNameConvention } = require("./get-store-name-convention");

function isEffectNameValid({ name }) {
  return Boolean(name?.endsWith("Fx"));
}

function isGateNameValid({ name }) {
  const [firstChar] = name.split("");

  return Boolean(firstChar?.toUpperCase() === firstChar);
}

function isStoreNameValid({ name, context }) {
  const storeNameConvention = getStoreNameConvention(context);

  // validate edge case
  if (name?.startsWith("$") && name?.endsWith("$")) {
    return false;
  }

  if (storeNameConvention === "prefix" && name?.startsWith("$")) {
    return true;
  }

  if (storeNameConvention === "postfix" && name?.endsWith("$")) {
    return true;
  }

  return false;
}

const namingOf = {
  effect: {
    isValid: (opts) => isEffectNameValid(opts),
    isInvalid: (opts) => !isEffectNameValid(opts),
  },
  store: {
    isValid: (opts) => isStoreNameValid(opts),
    isInvalid: (opts) => !isStoreNameValid(opts),
  },
  gate: {
    isValid: (opts) => isGateNameValid(opts),
    isInvalid: (opts) => !isGateNameValid(opts),
  },
};

module.exports = { namingOf };
