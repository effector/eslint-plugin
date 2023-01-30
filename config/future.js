const all = require("./all");

module.exports = Object.assign({}, all, {
  rules: {
    "effector/prefer-sample-over-forward-with-mapping": "off",
    "effector/no-forward": "warn",
    "effector/no-guard": "warn",
  },
});
