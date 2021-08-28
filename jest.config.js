module.exports = {
  testRegex: "./.+\\.test\\.js$",
  collectCoverage: false,
  collectCoverageFrom: ["rules/**/*.js"],
  moduleFileExtensions: ["js"],
  coverageReporters: ["text-summary", "lcov"],
};
