# Contributing

## Development

Install dependencies and run the full verification suite:

```bash
npm install
npm run verify
```

`npm run verify` runs, in order:

1. `npm run typecheck` — `tsc --noEmit`
2. `npm run lint` — ESLint over the whole repository
3. `npm run build` — `tsup` produces the ESM + CJS + `.d.ts` output in `dist/`
4. `npm run test` — the Vitest suite (rule tests + integration tests)
5. `node scripts/test-packed-package.mjs` — packs the package and verifies the
   ESM and CommonJS entry points import correctly

## Release process

Releases are published to npm through GitHub Actions using **npm Trusted
Publishing (OIDC)** — no long-lived npm token is stored in the repository.

1. Update the `version` field in `package.json`.
2. Update `CHANGELOG.md`.
3. Merge the release commit into `main`.
4. Create a GitHub Release for a tag named `v<package-version>` (e.g. `v0.1.0`).
5. Publishing the release triggers `.github/workflows/publish.yml`, which
   re-verifies the tag/version match, runs `npm run verify`, and publishes.

The GitHub Release tag **must** exactly equal `v<package.json version>`; the
publish workflow fails before `npm publish` if they differ. A published version
cannot be reused — to fix a failed release, correct the package, bump the
version, and create a new release.

## First-publication bootstrap (one time only)

npm Trusted Publishing is configured from an existing package's settings page, so
the very first version must be published manually as a bootstrap step:

1. `npm run verify`
2. `npm pack --dry-run` to inspect the package contents
3. Sign in to npm locally (with 2FA enabled)
4. `npm publish --access public`
5. In the npm package settings, configure the Trusted Publisher:
   - Provider: GitHub Actions
   - Repository owner / repository: this repo
   - Workflow filename: `publish.yml`
6. Run all subsequent releases through GitHub Actions.
7. After confirming Trusted Publishing works, set the npm package to
   "Require two-factor authentication and disallow tokens".
