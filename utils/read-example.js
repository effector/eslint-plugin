const { readFileSync } = require("fs");
const { join } = require("path");
const glob = require("glob");

function readExample(dirname, exampleName) {
  return readFileSync(join(dirname, "examples", exampleName)).toString();
}

function getCorrectExamples(dirname, config = {}) {
  const { ext = "js", namesOnly = true } = config;
  const pattern = `correct-*.${ext}`;
  const correct = glob.sync(join(dirname, "examples", pattern));

  let result = correct;

  if (namesOnly) {
    result = result.map((path) => {
      const rightSlashIdx = path.lastIndexOf("/");

      return path.slice(rightSlashIdx + 1);
    });
  }

  return result;
}

function getIncorrectExamples(dirname, config = {}) {
  const { ext = "js", namesOnly = true } = config;
  const pattern = `incorrect-*.${ext}`;
  const incorrect = glob.sync(join(dirname, "examples", pattern));

  let result = incorrect;

  if (namesOnly) {
    result = result.map((path) => {
      const rightSlashIdx = path.lastIndexOf("/");

      return path.slice(rightSlashIdx + 1);
    });
  }

  return result;
}

module.exports = { readExample, getCorrectExamples, getIncorrectExamples };
