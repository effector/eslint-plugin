const glob = require("glob");
const path = require("path");

console.log("Start rule tests...");

glob
  .sync(path.join(__dirname, "..", "rules", "**", "*.test.js"))
  .forEach((file) => require(path.resolve(file)));

console.log("Rule tests completed");
