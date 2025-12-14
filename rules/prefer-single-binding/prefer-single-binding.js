const {createLinkToRule} = require("../../utils/create-link-to-rule");
module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Recommend using a single useUnit call instead of multiple',
            category: 'Best Practices',
            recommended: true,
            url: createLinkToRule("prefer-single-binding"),
        },
        messages: {
            multipleUseUnit: 'Multiple useUnit calls detected. Consider combining them into a single call for better performance.',
        },
        schema: [],
        fixable: 'code',
    },
    create(context) {
        return {
            'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
                const body = node.body.type === 'BlockStatement' ? node.body.body : null;
                if (!body) return;

                const useUnitCalls = [];

                // Ищем все вызовы useUnit в теле функции
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

                // Если найдено более одного useUnit, сообщаем об ошибке
                if (useUnitCalls.length > 1) {
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
            },
        };
    },
};

function generateFix(fixer, useUnitCalls, context) {
    const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;

    // Определяем, используется ли объектная или массивная форма
    const firstArg = useUnitCalls[0].init.arguments[0];
    const isArrayForm = firstArg && firstArg.type === 'ArrayExpression';
    const isObjectForm = firstArg && firstArg.type === 'ObjectExpression';

    // Если формы смешанные или неопределенные, не пытаемся исправить автоматически
    const allSameForm = useUnitCalls.every((call) => {
        const arg = call.init.arguments[0];
        if (isArrayForm) return arg && arg.type === 'ArrayExpression';
        if (isObjectForm) return arg && arg.type === 'ObjectExpression';
        return false;
    });

    if (!allSameForm) return null;

    const fixes = [];

    if (isArrayForm) {
        // Собираем все элементы массивов
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

        // Создаем объединенный вызов
        const combinedCode = `const [${allDestructured.join(', ')}] = useUnit([${allElements.join(', ')}]);`;

        // Заменяем первый вызов на объединенный
        fixes.push(fixer.replaceText(useUnitCalls[0].statement, combinedCode));

        // Удаляем остальные вызовы
        for (let i = 1; i < useUnitCalls.length; i++) {
            const statement = useUnitCalls[i].statement;
            const token = sourceCode.getTokenBefore(statement);

            // Находим начало строки (включая отступы)
            let startIndex = statement.range[0];
            const lineStart = sourceCode.text.lastIndexOf('\n', startIndex - 1) + 1;
            const textBeforeStatement = sourceCode.text.slice(lineStart, startIndex);

            // Если перед statement только пробелы, удаляем всю строку
            if (/^\s*$/.test(textBeforeStatement)) {
                startIndex = lineStart;
            }

            // Находим конец (включая перенос строки)
            const endIndex = statement.range[1];
            const nextChar = sourceCode.text[endIndex];
            const removeEnd = (nextChar === '\n' || nextChar === '\r') ? endIndex + 1 : endIndex;

            fixes.push(fixer.removeRange([startIndex, removeEnd]));
        }
    } else if (isObjectForm) {
        // Собираем все свойства объектов
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

        // Создаем объединенный вызов
        const combinedCode = `const { ${allDestructuredProps.join(', ')} } = useUnit({ ${allProperties.join(', ')} });`;

        // Заменяем первый вызов на объединенный
        fixes.push(fixer.replaceText(useUnitCalls[0].statement, combinedCode));

        // Удаляем остальные вызовы
        for (let i = 1; i < useUnitCalls.length; i++) {
            const statement = useUnitCalls[i].statement;

            // Находим начало строки (включая отступы)
            let startIndex = statement.range[0];
            const lineStart = sourceCode.text.lastIndexOf('\n', startIndex - 1) + 1;
            const textBeforeStatement = sourceCode.text.slice(lineStart, startIndex);

            // Если перед statement только пробелы, удаляем всю строку
            if (/^\s*$/.test(textBeforeStatement)) {
                startIndex = lineStart;
            }

            // Находим конец (включая перенос строки)
            const endIndex = statement.range[1];
            const nextChar = sourceCode.text[endIndex];
            const removeEnd = (nextChar === '\n' || nextChar === '\r') ? endIndex + 1 : endIndex;

            fixes.push(fixer.removeRange([startIndex, removeEnd]));
        }
    }

    return fixes;
}