import { RuleTester } from "eslint";
import rule from "../../src/rules/compact-guard-clause.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

ruleTester.run("compact-guard-clause", rule, {
  valid: [
    // Already compact return guard.
    "function f(x) { if (!x) return; return x; }",
    "function f(x) { if (!x) return 0; return x; }",
    // Already compact throw guard.
    'function f(x) { if (!x) throw new Error("nope"); return x; }',
    // Multi-line returned expression is allowed as long as the keyword is on the
    // same line as the closing parenthesis.
    "function f(x) { if (!x) return doSomething(\n  x,\n  x + 1,\n); return x; }",
    // Not a guard clause: block has more than one statement.
    "function f(x) { if (!x) { doSomething(); return 0; } return x; }",
    // Not a guard clause: has an else branch.
    "function f(x) { if (!x) { return 0; } else { return 1; } }",
    // Not a guard clause: else-if branch.
    "function f(x) { if (x === 1) return 1; else if (x === 2) return 2; }",
    // Not a guard: consequent is neither return nor throw.
    "function f(x) { if (!x) doSomething(); return x; }",
  ],
  invalid: [
    // Braces around a single return should be removed.
    {
      code: "function f(x) { if (!x) { return 0; } return x; }",
      output: "function f(x) { if (!x) return 0; return x; }",
      errors: [{ messageId: "compactGuard", data: { keyword: "return" } }],
    },
    // Keyword on a separate line should be pulled up.
    {
      code: "function f(x) {\n  if (!x)\n    return 0;\n  return x;\n}",
      output: "function f(x) {\n  if (!x) return 0;\n  return x;\n}",
      errors: [{ messageId: "compactGuard", data: { keyword: "return" } }],
    },
    // Braces + newline.
    {
      code: "function f(x) {\n  if (!x) {\n    return 0;\n  }\n  return x;\n}",
      output: "function f(x) {\n  if (!x) return 0;\n  return x;\n}",
      errors: [{ messageId: "compactGuard", data: { keyword: "return" } }],
    },
    // Throw guard with braces.
    {
      code: 'function f(x) { if (!x) { throw new Error("nope"); } return x; }',
      output: 'function f(x) { if (!x) throw new Error("nope"); return x; }',
      errors: [{ messageId: "compactGuard", data: { keyword: "throw" } }],
    },
    // Multi-line returned expression inside braces: braces removed, expression kept.
    {
      code: "function f(x) {\n  if (!x) {\n    return doSomething(\n      x,\n      x + 1,\n    );\n  }\n  return x;\n}",
      output:
        "function f(x) {\n  if (!x) return doSomething(\n      x,\n      x + 1,\n    );\n  return x;\n}",
      errors: [{ messageId: "compactGuard", data: { keyword: "return" } }],
    },
    // Comment inside the block: reported but NOT auto-fixed (output unchanged).
    {
      code: "function f(x) {\n  if (!x) {\n    // early exit\n    return 0;\n  }\n  return x;\n}",
      output: null,
      errors: [{ messageId: "compactGuardUnsafe", data: { keyword: "return" } }],
    },
    // Trailing comment inside the block is also unsafe.
    {
      code: "function f(x) {\n  if (!x) {\n    return 0; // done\n  }\n  return x;\n}",
      output: null,
      errors: [{ messageId: "compactGuardUnsafe", data: { keyword: "return" } }],
    },
  ],
});
