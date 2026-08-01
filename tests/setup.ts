import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";

// Wire ESLint's RuleTester into Vitest's test runner so rule cases show up as
// individual Vitest tests. The static hook properties are not fully described by
// ESLint's published types, so assign them through a narrowed view.
const testerHooks = RuleTester as unknown as {
  afterAll: typeof afterAll;
  describe: typeof describe;
  it: typeof it;
  itOnly: typeof it.only;
};

testerHooks.afterAll = afterAll;
testerHooks.describe = describe;
testerHooks.it = it;
testerHooks.itOnly = it.only;
