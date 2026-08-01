import type { ESLint, Linter, Rule } from "eslint";
import compactGuardClause from "./rules/compact-guard-clause.js";

const PLUGIN_NAME = "compact-guards";

const rules: Record<string, Rule.RuleModule> = {
  "compact-guard-clause": compactGuardClause,
};

const plugin: ESLint.Plugin = {
  meta: {
    name: "eslint-plugin-compact-guards",
    version: "0.1.0",
  },
  rules,
  configs: {},
};

const recommended: Linter.Config = {
  plugins: {
    [PLUGIN_NAME]: plugin,
  },
  rules: {
    [`${PLUGIN_NAME}/compact-guard-clause`]: "error",
  },
};

// Assigned after `plugin` is created so the flat config can reference the plugin object itself.
plugin.configs = {
  recommended,
};

export default plugin;
export { compactGuardClause, recommended };
