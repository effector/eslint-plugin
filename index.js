const configAll = require("./config/all");
const configRecommended = require("./config/recommended");
const configScope = require("./config/scope");
const configReact = require("./config/react");
const configFuture = require("./config/future");
const configPatronum = require("./config/patronum");

const allRules = require("./rules");

const eslintrcPlugins = ["effector"];

module.exports = {
  rules: allRules,
  configs: {
    all: Object.assign({}, configAll, {
      plugins: eslintrcPlugins,
    }),
    recommended: Object.assign({}, configRecommended, {
      plugins: eslintrcPlugins,
    }),
    scope: Object.assign({}, configScope, {
      plugins: eslintrcPlugins,
    }),
    react: Object.assign({}, configReact, {
      plugins: eslintrcPlugins,
    }),
    future: Object.assign({}, configFuture, {
      plugins: eslintrcPlugins,
    }),
    patronum: Object.assign({}, configPatronum, {
      plugins: eslintrcPlugins,
    }),
  },
};
