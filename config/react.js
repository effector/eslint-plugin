const all = require("./all");

module.exports = Object.assign({}, all, {
  rules: {
    "effector/enforce-gate-naming-convention": "error",
    "effector/mandatory-scope-binding": "error",
    "effector/prefer-useUnit": "warn",
  },
});
