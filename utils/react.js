// borrowed from
// https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js

/**
 * Checks if the node is a React component name. React component names must
 * always start with a non-lowercase letter. So `MyComponent` or `_MyComponent`
 * are valid component names for instance.
 */
function isComponentName(node) {
  if (node.type === "Identifier") {
    return !/^[a-z]/.test(node.name);
  } else {
    return false;
  }
}

function isReactFunction(node, functionName) {
  return (
    node.name === functionName ||
    (node.type === "MemberExpression" &&
      node.object.name === "React" &&
      node.property.name === functionName)
  );
}

/**
 * Checks if the node is a callback argument of forwardRef. This render function
 * should follow the rules of hooks.
 */

function isForwardRefCallback(node) {
  return !!(
    node.parent &&
    node.parent.callee &&
    isReactFunction(node.parent.callee, "forwardRef")
  );
}

/**
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */

function isMemoCallback(node) {
  return !!(
    node.parent &&
    node.parent.callee &&
    isReactFunction(node.parent.callee, "memo")
  );
}

function isInsideReactComponent(node) {
  while (node) {
    const functionName = getFunctionName(node);
    if (functionName) {
      if (isComponentName(functionName)) {
        return true;
      }
    }
    if (isForwardRefCallback(node) || isMemoCallback(node)) {
      return true;
    }
    node = node.parent;
  }
  return false;
}

module.exports = {
  isInsideReactComponent,
};
