const all = require("./all");

module.exports = Object.assign({}, all, {
  rules: {
    "effector/strict-effect-handlers": "error",
  },
});
