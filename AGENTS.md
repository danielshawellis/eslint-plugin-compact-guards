# AGENTS.md

## Cursor Cloud specific instructions

This repository is a single npm **library** — the ESLint plugin
`eslint-plugin-compact-guards`. It is not an application: there are no
long-running services, servers, databases, or ports. "Running it" means building
the package and running the rule through ESLint.

### Dev commands

All standard commands live in `package.json` `scripts` (see there for the source
of truth). The umbrella command is `npm run verify`, which runs, in order:
`typecheck` (`tsc --noEmit`) → `lint` (`eslint .`) → `build` (`tsup`, dual
ESM+CJS+`.d.ts` into `dist/`) → `test` (`vitest run`) → the packed-package smoke
test. The release/publish workflow and one-time npm bootstrap are documented in
`CONTRIBUTING.md`.

### Non-obvious notes

- Dependencies are installed with `npm install` (the update script does this
  automatically on VM startup). Local dev here uses Node 22; the CI matrix in
  `.github/workflows/ci.yml` covers Node 18/20/24 and ESLint 8.57.1/9/10.
- Tests import the rule/plugin directly from `src/` (not from `dist/`), so you do
  not need to build before running `npm test`. `tests/setup.ts` wires ESLint's
  `RuleTester` into Vitest's runner — rule cases appear as individual Vitest
  tests.
- `scripts/test-packed-package.mjs` (part of `npm run verify`) runs `npm pack`,
  installs the resulting tarball into a throwaway temp project, and imports it via
  both ESM and CJS. It needs **network access to the npm registry** (npm
  auto-installs the `eslint` peer dependency into the temp consumer). If offline,
  this step fails even though the rest of `verify` passes.
- To try the rule by hand: `npm run build`, then point an ESLint flat config's
  `plugins` at the built plugin (`import compactGuards from "./dist/index.js"`)
  and run `eslint <file> --fix`. Guard clauses that contain comments are reported
  but intentionally left unfixed.
