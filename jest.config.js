module.exports = {
  testRegex: "./.+\\.test\\.js$",
  collectCoverage: false,
  collectCoverageFrom: ["rules/**/{!(examples),}/*.js"],
  moduleFileExtensions: ["js"],
  coverageReporters: ["text-summary", "lcov"],
};
