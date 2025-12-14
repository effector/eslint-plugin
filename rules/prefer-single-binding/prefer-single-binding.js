const {createLinkToRule} = require("../../utils/create-link-to-rule");
module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Recommend using a single useUnit call instead of multiple',
            category: 'Best Practices',
            recommended: true,
            url: createLinkToRule('prefer-single-binding'),
        },
        messages: {
            multipleUseUnit: 'Multiple useUnit calls detected. Consider combining them into a single call for better performance.',
            mixedStoresAndEvents: 'useUnit call contains both stores and events. Consider separating them into different calls.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowSeparateStoresAndEvents: {
                        type: 'boolean',
                        default: false,
                    },
                    enforceStoresAndEventsSeparation: {
                        type: 'boolean',
                        default: false,
                    },
                },
                additionalProperties: false,
            },
        ],
        fixable: 'code',
    },
    create(context) {
        const options = context.options[0] || {};
        const allowSeparateStoresAndEvents = options.allowSeparateStoresAndEvents || false;
        const enforceStoresAndEventsSeparation = options.enforceStoresAndEventsSeparation || false;

        return {
            'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
                const body = node.body.type === 'BlockStatement' ? node.body.body : null;
                if (!body) return;

                const useUnitCalls = [];

                // Find all useUnit calls in the function body
                body.forEach((statement) => {
                    if (
                        statement.type === 'VariableDeclaration' &&
                        statement.declarations.length > 0
                    ) {
                        statement.declarations.forEach((declarator) => {
                            if (
                                declarator.init &&
                                declarator.init.type === 'CallExpression' &&
                                declarator.init.callee.type === 'Identifier' &&
                                declarator.init.callee.name === 'useUnit'
                            ) {
                                useUnitCalls.push({
                                    statement,
                                    declarator,
                                    init: declarator.init,
                                    id: declarator.id,
                                });
                            }
                        });
                    }
                });

                // Check if enforceStoresAndEventsSeparation is enabled
                if (enforceStoresAndEventsSeparation) {
                    useUnitCalls.forEach((call) => {
                        const mixedTypes = checkMixedTypes(call);
                        if (mixedTypes) {
                            context.report({
                                node: call.init,
                                messageId: 'mixedStoresAndEvents',
                                fix(fixer) {
                                    return generateSeparationFix(fixer, call, mixedTypes, context);
                                },
                            });
                        }
                    });

                    // When enforceStoresAndEventsSeparation is true, don't check for multiple calls
                    // because we want separate calls for stores and events
                    return;
                }

                // If more than one useUnit call is found
                if (useUnitCalls.length > 1) {
                    // If the option to separate stores and events is enabled
                    if (allowSeparateStoresAndEvents) {
                        const groups = groupByType(useUnitCalls);

                        // Check stores group
                        if (groups.stores.length > 1) {
                            reportMultipleCalls(context, groups.stores);
                        }

                        // Check events group
                        if (groups.events.length > 1) {
                            reportMultipleCalls(context, groups.events);
                        }

                        // Check unknown group (also merge if more than one)
                        if (groups.unknown.length > 1) {
                            reportMultipleCalls(context, groups.unknown);
                        }
                    } else {
                        // Default behavior - all useUnit calls should be combined
                        useUnitCalls.forEach((call, index) => {
                            if (index > 0) {
                                context.report({
                                    node: call.init,
                                    messageId: 'multipleUseUnit',
                                    fix(fixer) {
                                        return generateFix(fixer, useUnitCalls, context);
                                    },
                                });
                            }
                        });
                    }
                }
            },
        };
    },
};

// Check if a single useUnit call contains mixed types (stores and events)
function checkMixedTypes(call) {
    const argument = call.init.arguments[0];

    if (!argument) return null;

    // Only check array form
    if (argument.type === 'ArrayExpression') {
        const elements = argument.elements.filter(el => el !== null);
        if (elements.length === 0) return null;

        const types = elements.map((element, index) => ({
            element,
            type: getElementType(element),
            index,
        }));

        const stores = types.filter(t => t.type === 'store');
        const events = types.filter(t => t.type === 'event');

        // If we have both stores and events, return the separation data
        if (stores.length > 0 && events.length > 0) {
            return { stores, events, allTypes: types };
        }
    }

    // Only check object form
    if (argument.type === 'ObjectExpression') {
        const properties = argument.properties.filter(prop => prop.type === 'Property');
        if (properties.length === 0) return null;

        const types = properties.map((prop, index) => ({
            property: prop,
            type: prop.value ? getElementType(prop.value) : 'unknown',
            index,
        }));

        const stores = types.filter(t => t.type === 'store');
        const events = types.filter(t => t.type === 'event');

        // If we have both stores and events, return the separation data
        if (stores.length > 0 && events.length > 0) {
            return { stores, events, allTypes: types, isObject: true };
        }
    }

    return null;
}

// Generate fix to separate mixed stores and events into different useUnit calls
function generateSeparationFix(fixer, call, mixedTypes, context) {
    const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;

    const { stores, events, isObject } = mixedTypes;

    const fixes = [];

    if (isObject) {
        // Object form
        const storeProps = stores.map(s => sourceCode.getText(s.property));
        const eventProps = events.map(e => sourceCode.getText(e.property));

        const storeKeys = stores.map(s => {
            const prop = s.property;
            if (prop.key && prop.key.type === 'Identifier') {
                return prop.key.name;
            }
            return sourceCode.getText(prop.key);
        });

        const eventKeys = events.map(e => {
            const prop = e.property;
            if (prop.key && prop.key.type === 'Identifier') {
                return prop.key.name;
            }
            return sourceCode.getText(prop.key);
        });

        // Get indentation
        const statementStart = call.statement.range[0];
        const lineStart = sourceCode.text.lastIndexOf('\n', statementStart - 1) + 1;
        const indent = sourceCode.text.slice(lineStart, statementStart);

        const storesCode = `const { ${storeKeys.join(', ')} } = useUnit({ ${storeProps.join(', ')} });`;
        const eventsCode = `const { ${eventKeys.join(', ')} } = useUnit({ ${eventProps.join(', ')} });`;

        const combinedCode = `${storesCode}\n${indent}${eventsCode}`;

        fixes.push(fixer.replaceText(call.statement, combinedCode));
    } else {
        // Array form
        const storeElements = stores.map(s => sourceCode.getText(s.element));
        const eventElements = events.map(e => sourceCode.getText(e.element));

        // Get destructured names
        const destructured = call.id.type === 'ArrayPattern' ? call.id.elements : [];
        const storeNames = stores.map(s => {
            const el = destructured[s.index];
            return el ? sourceCode.getText(el) : null;
        }).filter(Boolean);

        const eventNames = events.map(e => {
            const el = destructured[e.index];
            return el ? sourceCode.getText(el) : null;
        }).filter(Boolean);

        // Get indentation
        const statementStart = call.statement.range[0];
        const lineStart = sourceCode.text.lastIndexOf('\n', statementStart - 1) + 1;
        const indent = sourceCode.text.slice(lineStart, statementStart);

        const storesCode = `const [${storeNames.join(', ')}] = useUnit([${storeElements.join(', ')}]);`;
        const eventsCode = `const [${eventNames.join(', ')}] = useUnit([${eventElements.join(', ')}]);`;

        const combinedCode = `${storesCode}\n${indent}${eventsCode}`;

        fixes.push(fixer.replaceText(call.statement, combinedCode));
    }

    return fixes;
}

// Determine the type of a single element
function getElementType(element) {
    if (!element) return 'unknown';

    // Simple identifier: $store or event
    if (element.type === 'Identifier') {
        const name = element.name;
        return name.startsWith('$') ? 'store' : 'event';
    }

    // MemberExpression: Model.$store or Model.event
    if (element.type === 'MemberExpression') {
        const property = element.property;

        if (property && property.type === 'Identifier') {
            const name = property.name;

            // Check by property name
            if (name.startsWith('$')) return 'store';

            // Heuristics to determine type by name
            const eventPatterns = [
                /Event$/i,        // submitEvent, clickEvent
                /Changed$/i,      // valueChanged, statusChanged
                /Triggered$/i,    // actionTriggered
                /Clicked$/i,      // buttonClicked
                /Pressed$/i,      // keyPressed
                /^on[A-Z]/,       // onClick, onSubmit
                /^handle[A-Z]/,   // handleClick, handleSubmit
                /^set[A-Z]/,      // setValue, setData
                /^update[A-Z]/,   // updateValue, updateData
                /^submit[A-Z]/,   // submitForm, submitData
            ];

            const storePatterns = [
                /^is[A-Z]/,       // isLoading, isVisible
                /^has[A-Z]/,      // hasError, hasData
                /Store$/i,        // userStore, dataStore
                /State$/i,        // appState, formState
                /^data$/i,        // data
                /^value$/i,       // value
                /^items$/i,       // items
            ];

            // Check event patterns
            if (eventPatterns.some(pattern => pattern.test(name))) {
                return 'event';
            }

            // Check store patterns
            if (storePatterns.some(pattern => pattern.test(name))) {
                return 'store';
            }

            // Default for MemberExpression without explicit $ - consider it an event
            // since methods are usually events
            return 'event';
        }
    }

    return 'unknown';
}

// Determine the unit type (store or event) by variable name
function getUnitType(call) {
    const argument = call.init.arguments[0];

    if (!argument) return 'unknown';

    // For arrays, look at elements
    if (argument.type === 'ArrayExpression') {
        const elements = argument.elements.filter(el => el !== null);
        if (elements.length === 0) return 'unknown';

        // Collect types of all elements
        const types = elements.map(element => getElementType(element));

        // Count each type
        const storeCount = types.filter(t => t === 'store').length;
        const eventCount = types.filter(t => t === 'event').length;
        const unknownCount = types.filter(t => t === 'unknown').length;

        // If all elements are of the same type
        if (storeCount === types.length) return 'store';
        if (eventCount === types.length) return 'event';
        if (unknownCount === types.length) return 'unknown';

        // If there's a mix, return the predominant type
        if (storeCount > eventCount && storeCount > unknownCount) return 'store';
        if (eventCount > storeCount && eventCount > unknownCount) return 'event';

        // If unclear, return unknown
        return 'unknown';
    }

    // For objects, look at properties
    if (argument.type === 'ObjectExpression') {
        const properties = argument.properties.filter(prop => prop.type === 'Property');
        if (properties.length === 0) return 'unknown';

        // Collect types of all properties
        const types = properties.map(prop => {
            if (prop.value) {
                return getElementType(prop.value);
            }
            return 'unknown';
        });

        // Count each type
        const storeCount = types.filter(t => t === 'store').length;
        const eventCount = types.filter(t => t === 'event').length;
        const unknownCount = types.filter(t => t === 'unknown').length;

        // If all properties are of the same type
        if (storeCount === types.length) return 'store';
        if (eventCount === types.length) return 'event';
        if (unknownCount === types.length) return 'unknown';

        // If there's a mix, return the predominant type
        if (storeCount > eventCount && storeCount > unknownCount) return 'store';
        if (eventCount > storeCount && eventCount > unknownCount) return 'event';

        return 'unknown';
    }

    return 'unknown';
}

// Group calls by type
function groupByType(useUnitCalls) {
    const stores = [];
    const events = [];
    const unknown = [];

    useUnitCalls.forEach(call => {
        const type = getUnitType(call);
        if (type === 'store') {
            stores.push(call);
        } else if (type === 'event') {
            events.push(call);
        } else {
            unknown.push(call);
        }
    });

    return { stores, events, unknown };
}

// Report error for a group of calls
function reportMultipleCalls(context, calls) {
    calls.forEach((call, index) => {
        if (index > 0) {
            context.report({
                node: call.init,
                messageId: 'multipleUseUnit',
                fix(fixer) {
                    return generateFix(fixer, calls, context);
                },
            });
        }
    });
}

function generateFix(fixer, useUnitCalls, context) {
    const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;

    // Determine if object or array form is used
    const firstArg = useUnitCalls[0].init.arguments[0];
    const isArrayForm = firstArg && firstArg.type === 'ArrayExpression';
    const isObjectForm = firstArg && firstArg.type === 'ObjectExpression';

    // If forms are mixed or undefined, don't try to fix automatically
    const allSameForm = useUnitCalls.every((call) => {
        const arg = call.init.arguments[0];
        if (isArrayForm) return arg && arg.type === 'ArrayExpression';
        if (isObjectForm) return arg && arg.type === 'ObjectExpression';
        return false;
    });

    if (!allSameForm) return null;

    const fixes = [];

    if (isArrayForm) {
        // Collect all array elements
        const allElements = [];
        const allDestructured = [];

        useUnitCalls.forEach((call) => {
            const arg = call.init.arguments[0];
            if (arg.elements) {
                allElements.push(...arg.elements.map(el => sourceCode.getText(el)));
            }

            if (call.id.type === 'ArrayPattern') {
                allDestructured.push(
                    ...call.id.elements.map(el => el ? sourceCode.getText(el) : null).filter(Boolean)
                );
            }
        });

        // Create combined call
        const combinedCode = `const [${allDestructured.join(', ')}] = useUnit([${allElements.join(', ')}]);`;

        // Replace first call with combined one
        fixes.push(fixer.replaceText(useUnitCalls[0].statement, combinedCode));

        // Remove remaining calls
        for (let i = 1; i < useUnitCalls.length; i++) {
            const statement = useUnitCalls[i].statement;

            // Find line start (including indentation)
            let startIndex = statement.range[0];
            const lineStart = sourceCode.text.lastIndexOf('\n', startIndex - 1) + 1;
            const textBeforeStatement = sourceCode.text.slice(lineStart, startIndex);

            // If only spaces before statement, remove the entire line
            if (/^\s*$/.test(textBeforeStatement)) {
                startIndex = lineStart;
            }

            // Find end (including newline)
            const endIndex = statement.range[1];
            const nextChar = sourceCode.text[endIndex];
            const removeEnd = (nextChar === '\n' || nextChar === '\r') ? endIndex + 1 : endIndex;

            fixes.push(fixer.removeRange([startIndex, removeEnd]));
        }
    } else if (isObjectForm) {
        // Collect all object properties
        const allProperties = [];
        const allDestructuredProps = [];

        useUnitCalls.forEach((call) => {
            const arg = call.init.arguments[0];
            if (arg.properties) {
                allProperties.push(...arg.properties.map(prop => sourceCode.getText(prop)));
            }

            if (call.id.type === 'ObjectPattern') {
                allDestructuredProps.push(
                    ...call.id.properties.map(prop => sourceCode.getText(prop))
                );
            }
        });

        // Create combined call
        const combinedCode = `const { ${allDestructuredProps.join(', ')} } = useUnit({ ${allProperties.join(', ')} });`;

        // Replace first call with combined one
        fixes.push(fixer.replaceText(useUnitCalls[0].statement, combinedCode));

        // Remove remaining calls
        for (let i = 1; i < useUnitCalls.length; i++) {
            const statement = useUnitCalls[i].statement;

            // Find line start (including indentation)
            let startIndex = statement.range[0];
            const lineStart = sourceCode.text.lastIndexOf('\n', startIndex - 1) + 1;
            const textBeforeStatement = sourceCode.text.slice(lineStart, startIndex);

            // If only spaces before statement, remove the entire line
            if (/^\s*$/.test(textBeforeStatement)) {
                startIndex = lineStart;
            }

            // Find end (including newline)
            const endIndex = statement.range[1];
            const nextChar = sourceCode.text[endIndex];
            const removeEnd = (nextChar === '\n' || nextChar === '\r') ? endIndex + 1 : endIndex;

            fixes.push(fixer.removeRange([startIndex, removeEnd]));
        }
    }

    return fixes;
}