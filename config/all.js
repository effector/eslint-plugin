const future = require("./future");
const patronum = require("./patronum");
const react = require("./react");
const recommended = require("./recommended");
const scope = require("./scope");

module.exports = {
  rules: Object.assign(
    {},
    future.rules,
    patronum.rules,
    react.rules,
    recommended.rules,
    scope.rules
  ),
};
