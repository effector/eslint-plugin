module.exports = {
  rules: {
    "effector/enforce-store-naming-convention": require("./rules/enforce-store-naming-convention/enforce-store-naming-convention"),
  },
  configs: {
    recommended: require("./config/recommended"),
  },
};
