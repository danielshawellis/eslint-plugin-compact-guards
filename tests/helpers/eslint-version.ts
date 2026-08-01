import eslintPkg from "eslint/package.json";
import { Linter } from "eslint";

export const eslintMajor = Number.parseInt(eslintPkg.version.split(".")[0] ?? "0", 10);

const ECMA_OPTIONS = { ecmaVersion: 2022 as const, sourceType: "module" as const };

/** RuleTester on ESLint 8 still expects eslintrc-style `parserOptions`. */
export function ruleTesterConfig() {
  return eslintMajor >= 9
    ? { languageOptions: ECMA_OPTIONS }
    : { parserOptions: ECMA_OPTIONS };
}

/** Flat-config `Linter` jobs use `languageOptions` once flat mode is enabled. */
export function linterFlatConfigLanguageOptions() {
  return { languageOptions: ECMA_OPTIONS };
}

export function createFlatConfigLinter(): Linter {
  return eslintMajor >= 9 ? new Linter() : new Linter({ configType: "flat" });
}
