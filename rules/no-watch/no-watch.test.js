const { RuleTester } = require("eslint");

const rule = require("./no-watch.js");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-watch.test", rule, {
  valid: [
    "myFx.finally.watch(myEvent);",
    "myEvent.watch((payload) => {if (Boolean(payload)) {myFx(payload);}});",
    "$awesome.updates.watch((data) => {myEvent(identity(data));});",
  ].map((code) => ({ code })),

  invalid: [],
});
