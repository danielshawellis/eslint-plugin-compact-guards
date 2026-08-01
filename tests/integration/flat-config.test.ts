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

describe("flat config integration", () => {
  it("reports a non-compact guard clause", () => {
    const code = "function f(x) {\n  if (!x) {\n    return 0;\n  }\n  return x;\n}";
    const messages = linter.verify(code, config);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe("compact-guards/compact-guard-clause");
  });

  it("auto-fixes a non-compact guard clause", () => {
    const code = "function f(x) {\n  if (!x) {\n    return 0;\n  }\n  return x;\n}";
    const { output, fixed } = linter.verifyAndFix(code, config);
    expect(fixed).toBe(true);
    expect(output).toBe("function f(x) {\n  if (!x) return 0;\n  return x;\n}");
  });

  it("does not report an already-compact guard clause", () => {
    const code = "function f(x) {\n  if (!x) return 0;\n  return x;\n}";
    const messages = linter.verify(code, config);
    expect(messages).toHaveLength(0);
  });

  it("reports but does not fix guards with ambiguous comments", () => {
    const code =
      "function f(x) {\n  if (!x) {\n    // bail\n    return 0;\n  }\n  return x;\n}";
    const { output, fixed } = linter.verifyAndFix(code, config);
    expect(fixed).toBe(false);
    expect(output).toBe(code);
  });
});
