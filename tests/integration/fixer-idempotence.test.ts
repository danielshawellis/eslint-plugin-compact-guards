import type { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import plugin from "../../src/index.js";
import {
  createFlatConfigLinter,
  linterFlatConfigLanguageOptions,
} from "../helpers/eslint-version.js";

const linter = createFlatConfigLinter();

const config: Linter.Config[] = [
  {
    plugins: { "compact-guards": plugin },
    rules: { "compact-guards/compact-guard-clause": "error" },
    ...linterFlatConfigLanguageOptions(),
  },
];

describe("fixer idempotence", () => {
  const cases = [
    "function f(x) {\n  if (!x) {\n    return 0;\n  }\n  return x;\n}",
    "function f(x) {\n  if (!x)\n    throw new Error('nope');\n  return x;\n}",
    "function f(x) {\n  if (!x) {\n    return doSomething(\n      x,\n      x + 1,\n    );\n  }\n  return x;\n}",
  ];

  it("produces a clean result and is stable across a second run", () => {
    for (const code of cases) {
      const first = linter.verifyAndFix(code, config);
      expect(first.fixed).toBe(true);

      // Fixed output must no longer report any problems.
      expect(linter.verify(first.output, config)).toHaveLength(0);

      // Running the fixer again must not change the already-fixed output.
      const second = linter.verifyAndFix(first.output, config);
      expect(second.fixed).toBe(false);
      expect(second.output).toBe(first.output);
    }
  });
});
