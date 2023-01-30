const allRules = require("../rules");

function configureAsError(rules) {
  return Object.fromEntries(
    Object.keys(rules).map((key) => [`effector/${key}`, 2])
  );
}
module.exports = {
  plugins: {
    effector: {
      rules: allRules,
    },
  },
  rules: configureAsError(allRules),
};
