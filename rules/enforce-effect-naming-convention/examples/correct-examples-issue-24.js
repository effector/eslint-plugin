import { combine } from "effector";

// Examples were found in production code-base with false-poitive detection on 0.1.2
// https://github.com/igorkamyshev/eslint-plugin-effector/issues/24

const $sourceOrDefault = combine($source, $allSources, (source, allSources) => {
  if (!source || source.length === 0) {
    return head(allSources) ?? "Freelance";
  }

  return source;
});
