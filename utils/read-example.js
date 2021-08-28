const { readFileSync } = require("fs");
const { join } = require("path");

function readExample(dirname, exampleName) {
  return readFileSync(join(dirname, "examples", exampleName)).toString();
}

module.exports = { readExample };
