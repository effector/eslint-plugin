import { afterAll, describe, it } from "vitest"
import { RuleTester } from "@typescript-eslint/rule-tester"

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.describeSkip = describe.skip
RuleTester.it = it
RuleTester.itOnly = it.only
RuleTester.itSkip = it.skip
