const all = require("./all");

module.exports = Object.assign({}, all, {
  rules: {
    "effector/no-patronum-debug": "error",
  },
});
