const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { isInsideReactComponent } = require("../../utils/react");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbids `Event` and `Effect` usage without `useEvent` in React components.",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("mandatory-useEvent"),
    },
    messages: {
      useEventNeeded:
        "{{ unitName }} must be wrapped with `useEvent` from `effector-react` before usage inside React components",
    },
    schema: [],
  },
  create(context) {},
};
