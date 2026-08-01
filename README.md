# eslint-plugin-compact-guards

[![CI](https://github.com/danielshawellis/eslint-plugin-compact-guards/actions/workflows/ci.yml/badge.svg)](https://github.com/danielshawellis/eslint-plugin-compact-guards/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/eslint-plugin-compact-guards)](https://www.npmjs.com/package/eslint-plugin-compact-guards)
[![license](https://img.shields.io/npm/l/eslint-plugin-compact-guards)](https://github.com/danielshawellis/eslint-plugin-compact-guards/blob/main/LICENSE)

An ESLint plugin that enforces **compact guard clauses**: no braces, with the
`return`/`throw` keyword on the same line as the closing parenthesis of the `if`
condition.

```js
// ✗ before
if (!user) {
  return null;
}

// ✓ after
if (!user) return null;
```

## Installation

```bash
npm install --save-dev eslint-plugin-compact-guards
```

This plugin supports ESLint `^8.57.1 || ^9 || ^10` and flat configuration.

## Usage (flat config)

```js
// eslint.config.js
import compactGuards from "eslint-plugin-compact-guards";

export default [
  compactGuards.configs.recommended,
];
```

Or wire the rule up manually:

```js
import compactGuards from "eslint-plugin-compact-guards";

export default [
  {
    plugins: { "compact-guards": compactGuards },
    rules: {
      "compact-guards/compact-guard-clause": "error",
    },
  },
];
```

## Rule

- [`compact-guard-clause`](https://github.com/danielshawellis/eslint-plugin-compact-guards/blob/main/docs/rules/compact-guard-clause.md) —
  enforce compact guard clauses (fixable).

## Development

```bash
npm install      # install dependencies
npm run build    # build ESM + CJS + type declarations with tsup
npm test         # run the Vitest suite
npm run lint     # lint the source
npm run verify   # typecheck + lint + build + test + packed-package smoke test
```

The full development and release workflow is documented in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
