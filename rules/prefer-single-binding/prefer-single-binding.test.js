const { RuleTester } = require("eslint");
const rule = require("./prefer-single-binding");

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
    },
});

ruleTester.run("effector/prefer-single-binding.test", rule, {
    valid: [
        // With enforceStoresAndEventsSeparation - already separated
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store] = useUnit([$store]);
          const [event] = useUnit([event]);
          return null;
        };
      `,
            options: [{ enforceStoresAndEventsSeparation: true }],
        },
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent]);
          const [sent, submit] = useUnit([HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
            options: [{ allowSeparateStoresAndEvents: true }],
        },
        // Once useUnit call - OK
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store, event] = useUnit([$store, event]);
          
          return null;
        };
      `,
        },
        // Once useUnit with object-shape - OK
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { store, event } = useUnit({ store: $store, event: event });
          
          return null;
        };
      `,
        },
        // useUnit outside of components - dont check
        {
            code: `
        import { useUnit } from "effector-react";
        const store = useUnit([$store]);
        const event = useUnit([event]);
      `,
        },
    ],

    invalid: [
        // Two useUnit calls with array-shape
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store] = useUnit([$store]);
          const [event] = useUnit([event]);
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store, event] = useUnit([$store, event]);
          
          return null;
        };
      `,
        },
        // Three useUnit with array-shape
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store] = useUnit([$store]);
          const [event] = useUnit([event]);
          const [another] = useUnit([$another]);
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store, event, another] = useUnit([$store, event, $another]);
          
          return null;
        };
      `,
        },
        // Two useUnit calls with object-shape
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { store } = useUnit({ store: $store });
          const { event } = useUnit({ event: event });
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { store, event } = useUnit({ store: $store, event: event });
          
          return null;
        };
      `,
        },
        // Multiple useUnit calls
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store1, store2] = useUnit([$store1, $store2]);
          const [event1, event2] = useUnit([event1, event2]);
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store1, store2, event1, event2] = useUnit([$store1, $store2, event1, event2]);
          
          return null;
        };
      `,
        },
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent]);
          const [sent] = useUnit([HelpFormModel.sentFormChanged]);
          const [submit] = useUnit([HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
            options: [{ allowSeparateStoresAndEvents: true }],
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent]);
          const [sent, submit] = useUnit([HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
        },

        // MemberExpression - два стора должны объединиться
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent]);
          const [isLoading] = useUnit([HelpFormModel.$isLoading]);
          const [submit] = useUnit([HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
            options: [{ allowSeparateStoresAndEvents: true }],
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent, isLoading] = useUnit([HelpFormModel.$isFormSent, HelpFormModel.$isLoading]);
          const [submit] = useUnit([HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
        },

        // Смешанные паттерны именования
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isVisible] = useUnit([Model.isVisible]);
          const [hasError] = useUnit([Model.hasError]);
          const [onClick] = useUnit([Model.onClick]);
          const [handleSubmit] = useUnit([Model.handleSubmit]);
          return null;
        };
      `,
            options: [{ allowSeparateStoresAndEvents: true }],
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isVisible, hasError] = useUnit([Model.isVisible, Model.hasError]);
          const [onClick, handleSubmit] = useUnit([Model.onClick, Model.handleSubmit]);
          return null;
        };
      `,
        },

        // Без опции - все должно объединиться
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent]);
          const [sent] = useUnit([HelpFormModel.sentFormChanged]);
          const [submit] = useUnit([HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent, sent, submit] = useUnit([HelpFormModel.$isFormSent, HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm]);
          return null;
        };
      `,
        },
        // enforceStoresAndEventsSeparation - mixed array
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [value, setValue] = useUnit([$store, event]);
          return null;
        };
      `,
            options: [{ enforceStoresAndEventsSeparation: true }],
            errors: [
                {
                    messageId: "mixedStoresAndEvents",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [value] = useUnit([$store]);
          const [setValue] = useUnit([event]);
          return null;
        };
      `,
        },

        // enforceStoresAndEventsSeparation - mixed array with multiple items
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [value1, value2, handler1, handler2] = useUnit([$store1, $store2, event1, event2]);
          return null;
        };
      `,
            options: [{ enforceStoresAndEventsSeparation: true }],
            errors: [
                {
                    messageId: "mixedStoresAndEvents",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [value1, value2] = useUnit([$store1, $store2]);
          const [handler1, handler2] = useUnit([event1, event2]);
          return null;
        };
      `,
        },

        // enforceStoresAndEventsSeparation - mixed object
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { value, setValue } = useUnit({ value: $store, setValue: event });
          return null;
        };
      `,
            options: [{ enforceStoresAndEventsSeparation: true }],
            errors: [
                {
                    messageId: "mixedStoresAndEvents",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { value } = useUnit({ value: $store });
          const { setValue } = useUnit({ setValue: event });
          return null;
        };
      `,
        },

        // Real example with model
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent, submit, reset] = useUnit([
            FormModel.$isFormSent,
            FormModel.submitForm,
            FormModel.resetForm,
          ]);
          return null;
        };
      `,
            options: [{ enforceStoresAndEventsSeparation: true }],
            errors: [
                {
                    messageId: "mixedStoresAndEvents",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [isFormSent] = useUnit([FormModel.$isFormSent]);
          const [submit, reset] = useUnit([FormModel.submitForm, FormModel.resetForm]);
          return null;
        };
      `,
        },
    ],
});