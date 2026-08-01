# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-08-01

### Changed

- README badges for CI status, npm version, and license.
- Dependabot groups weekly minor/patch dev-dependency updates and ignores major
  bumps; documented in `CONTRIBUTING.md`.

## [0.1.1] - 2026-08-01

### Fixed

- Correct GitHub repository URLs in package metadata and the `compact-guard-clause`
  rule documentation link.
- README rule documentation link now points to GitHub so it works on the npm
  package page (relative links resolve against npmjs.com and 404).
- CI matrix jobs no longer run typecheck against swapped ESLint versions (ESLint
  8 lacks bundled types; ESLint 10 removed `getSourceCode` from `RuleContext`
  types).
- `compact-guard-clause` source-code access is compatible with ESLint 8–10 types.

## [0.1.0] - 2026-08-01

### Added

- Initial implementation of the `compact-guard-clause` rule.
- `recommended` flat config.
- Dual ESM/CommonJS build with type declarations.
- CI and npm Trusted Publishing release workflows.
