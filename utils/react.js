// borrowed from
// https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js

/**
 * Catch all identifiers that begin with "use" followed by an uppercase Latin
 * character to exclude identifiers like "user".
 */

function isHookName(s) {
  return /^use[A-Z0-9].*$/.test(s);
}

/**
 * We consider hooks to be a hook name identifier or a member expression
 * containing a hook name.
 */

function isHook(node) {
  if (node.type === "Identifier") {
    return isHookName(node.name);
  } else if (
    node.type === "MemberExpression" &&
    !node.computed &&
    isHook(node.property)
  ) {
    const obj = node.object;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return obj.type === "Identifier" && isPascalCaseNameSpace.test(obj.name);
  } else {
    return false;
  }
}

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
      if (isComponentName(functionName) || isHook(functionName)) {
        return true;
      }
    }
    if (isForwardRefCallback(node) || isMemoCallback(node)) {
      return true;
    }

    if (isClass(node) && !isClassComponent(node)) {
      return false;
    }

    if (isClassComponent(node)) {
      return true;
    }

    node = node.parent;
  }
  return false;
}

function isClass(node) {
  return node?.type === "ClassDeclaration";
}

function isClassComponent(node) {
  if (!node?.superClass) {
    return false;
  }
  if (node?.superClass?.type === "MemberExpression") {
    return (
      node?.superClass?.object?.name === "React" &&
      /^(Pure)?Component$/.test(node?.superClass?.property?.name)
    );
  }
  if (node?.superClass?.type === "Identifier") {
    return /^(Pure)?Component$/.test(node?.superClass?.name);
  }

  return false;
}

function isInsideReactHook(node) {
  while (node) {
    const functionName = getFunctionName(node);
    if (functionName) {
      if (isHook(functionName)) {
        return true;
      }
    }
    node = node.parent;
  }
  return false;
}

module.exports = {
  isInsideReactComponent,
  isInsideReactHook,
};

/**
 * Gets the static name of a function AST node. For function declarations it is
 * easy. For anonymous function expressions it is much harder. If you search for
 * `IsAnonymousFunctionDefinition()` in the ECMAScript spec you'll find places
 * where JS gives anonymous function expressions names. We roughly detect the
 * same AST nodes with some exceptions to better fit our use case.
 */

function getFunctionName(node) {
  if (
    node.type === "FunctionDeclaration" ||
    (node.type === "FunctionExpression" && node.id)
  ) {
    // function useHook() {}
    // const whatever = function useHook() {};
    //
    // Function declaration or function expression names win over any
    // assignment statements or other renames.
    return node.id;
  } else if (
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    if (
      node.parent.type === "VariableDeclarator" &&
      node.parent.init === node
    ) {
      // const useHook = () => {};
      return node.parent.id;
    } else if (
      node.parent.type === "AssignmentExpression" &&
      node.parent.right === node &&
      node.parent.operator === "="
    ) {
      // useHook = () => {};
      return node.parent.left;
    } else if (
      node.parent.type === "Property" &&
      node.parent.value === node &&
      !node.parent.computed
    ) {
      // {useHook: () => {}}
      // {useHook() {}}
      return node.parent.key;

      // NOTE: We could also support `ClassProperty` and `MethodDefinition`
      // here to be pedantic. However, hooks in a class are an anti-pattern. So
      // we don't allow it to error early.
      //
      // class {useHook = () => {}}
      // class {useHook() {}}
    } else if (
      node.parent.type === "AssignmentPattern" &&
      node.parent.right === node &&
      !node.parent.computed
    ) {
      // const {useHook = () => {}} = {};
      // ({useHook = () => {}} = {});
      //
      // Kinda clowny, but we'd said we'd follow spec convention for
      // `IsAnonymousFunctionDefinition()` usage.
      return node.parent.left;
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}
