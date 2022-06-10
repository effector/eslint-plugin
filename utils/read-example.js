const { readFileSync } = require("fs");
const { join } = require("path");
const glob = require("glob");

function readExample(dirname, exampleName) {
  return readFileSync(join(dirname, "examples", exampleName)).toString();
}

function getCorrectExamples(dirname, config = {}) {
  const { ext, namesOnly = true } = config;
  const pattern = `correct-*.${resolveExtension(ext)}`;
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

function resolveExtension(ext) {
  const DEFAULT_EXT = "js";

  if (Array.isArray(ext)) {
    if (ext.length === 0) {
      return DEFAULT_EXT;
    }

    if (ext.length === 1) {
      return ext[0];
    }

    return `{${ext.join(",")}}`;
  }

  return ext ?? DEFAULT_EXT;
}

function getIncorrectExamples(dirname, config = {}) {
  const { ext, namesOnly = true } = config;
  const pattern = `incorrect-*.${resolveExtension(ext)}`;
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
