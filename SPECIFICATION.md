# Specification status and implementation discretion

This document describes the intended behavior of `eslint-plugin-compact-guards` and provides suggested implementation, testing, packaging, and release practices.

The rule’s externally observable behavior is the primary requirement:

* qualifying `return` and `throw` guard clauses must not use braces;
* the `return` or `throw` keyword must begin on the same line as the closing parenthesis of the `if` condition;
* the returned or thrown expression may span multiple lines;
* safe violations should be autofixable;
* unsafe fixes, particularly ambiguous comment transformations, should be reported without being automatically changed.

The remaining implementation details are informed recommendations rather than inflexible requirements.

The developer should use their judgment while implementing the package. If experimentation, current ESLint APIs, parser behavior, packaging tools, or test results reveal that an implementation proposed here is incorrect, unnecessarily complicated, outdated, or less maintainable than another approach, the developer should use the cleaner and more reliable approach.

The developer should:

1. preserve the documented rule behavior;
2. preserve runtime semantics;
3. maintain broad practical compatibility;
4. write tests that demonstrate the behavior;
5. document any intentional departures from these recommendations;
6. prefer evidence from working code and current upstream documentation over assumptions in this specification.

This specification should guide implementation without preventing the developer from learning and improving the design as work progresses.

---

# Updated repository structure

The suggested repository structure should include separate continuous-integration and publication workflows:

```text
eslint-plugin-compact-guards/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── publish.yml
│   └── dependabot.yml
├── src/
│   ├── index.ts
│   └── rules/
│       └── compact-guard-clause.ts
├── tests/
│   ├── setup.ts
│   ├── rules/
│   │   └── compact-guard-clause.test.ts
│   ├── integration/
│   │   ├── plugin-exports.test.ts
│   │   ├── flat-config.test.ts
│   │   └── fixer-idempotence.test.ts
│   └── fixtures/
├── scripts/
│   └── test-packed-package.mjs
├── docs/
│   └── rules/
│       └── compact-guard-clause.md
├── eslint.config.js
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── README.md
├── CHANGELOG.md
└── LICENSE
```

The exact file organization may change when another structure is demonstrably simpler.

---

# GitHub Actions continuous integration

## Purpose

Continuous integration and npm publication should be separate workflows.

The CI workflow should run on:

* pull requests;
* pushes to the default branch.

The publication workflow should independently rerun all release-critical checks. It should not assume that a previous CI run tested the exact package contents being published.

## Suggested CI workflow

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  verify:
    name: Verify
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        include:
          - node-version: "18"
            eslint-version: "8.57.1"

          - node-version: "20"
            eslint-version: "9"

          - node-version: "20"
            eslint-version: "10"

          - node-version: "24"
            eslint-version: "10"

    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install matrix ESLint version
        run: npm install --no-save --ignore-scripts eslint@${{ matrix.eslint-version }}

      - name: Verify package
        run: npm run verify
```

The exact matrix should track the versions the package actually advertises. Unsupported combinations should not be included merely to make the matrix appear broader.

If installing a matrix ESLint version after `npm ci` creates dependency-resolution problems, separate fixture installations, package-manager overrides, or another clean compatibility-testing approach may be used instead.

---

# Publishing to npm through GitHub Actions

## Recommended release model

Use a dedicated GitHub Actions workflow triggered when a GitHub Release is published:

```text
.github/workflows/publish.yml
```

The release process should be:

1. Update the version in `package.json`.
2. Update the changelog.
3. Merge the release commit into the default branch.
4. Create a GitHub Release for a tag named `v<package-version>`.
5. Let the release event invoke `publish.yml`.
6. Verify the tag, test the package, build it, and publish it to npm.

GitHub documents the `release` event with `types: [published]` as a standard way to trigger npm publication after tests pass.

Using a GitHub Release rather than publishing every pushed tag provides a simple human-controlled release gate without requiring a custom release-management tool.

## Authentication

Use npm Trusted Publishing with OpenID Connect rather than storing an npm write token in GitHub.

Trusted Publishing creates a trust relationship between npm and one specific GitHub Actions workflow. It uses short-lived OIDC credentials and eliminates the need for a long-lived npm publication token. npm currently requires:

* a GitHub-hosted runner;
* Node.js 22.14.0 or newer;
* npm 11.5.1 or newer;
* `id-token: write` permission in the workflow.

Trusted Publishing automatically generates npm provenance attestations for packages published through GitHub Actions, so the workflow does not need to pass `--provenance`.

## Package registry configuration

The package should explicitly identify the npm registry:

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

Because this package is intended only for the public npm registry, limiting publication to one registry is appropriate. GitHub documents that `publishConfig` can define the publication registry without requiring `registry-url` in `actions/setup-node`.

The workflow should not define `NPM_TOKEN` or `NODE_AUTH_TOKEN` when using Trusted Publishing.

## Suggested publication workflow

```yaml
name: Publish to npm

on:
  release:
    types:
      - published

permissions:
  contents: read
  id-token: write

concurrency:
  group: npm-publish
  cancel-in-progress: false

jobs:
  publish:
    name: Publish
    if: ${{ github.event.release.prerelease == false }}
    runs-on: ubuntu-latest

    steps:
      - name: Check out release tag
        uses: actions/checkout@v7
        with:
          ref: ${{ github.event.release.tag_name }}
          persist-credentials: false

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: "24"
          package-manager-cache: false

      - name: Ensure an OIDC-capable npm version
        run: npm install --global npm@11

      - name: Verify release tag
        shell: bash
        env:
          RELEASE_TAG: ${{ github.event.release.tag_name }}
        run: |
          package_version="$(node -p "require('./package.json').version")"
          expected_tag="v${package_version}"

          if [ "$RELEASE_TAG" != "$expected_tag" ]; then
            echo "Release tag '$RELEASE_TAG' does not match package version '$package_version'."
            echo "Expected tag: '$expected_tag'."
            exit 1
          fi

      - name: Install dependencies
        run: npm ci

      - name: Verify package
        run: npm run verify

      - name: Publish package
        run: npm publish
```

The workflow intentionally:

* checks out the release tag rather than implicitly using another ref;
* grants only `contents: read` and `id-token: write`;
* does not store an npm publication token;
* disables package-manager caching in the privileged publication job;
* verifies that the GitHub tag matches `package.json`;
* runs the complete verification suite again;
* makes `npm publish` the final step;
* prevents concurrent publication jobs;
* ignores GitHub prereleases in the initial implementation.

npm’s current example disables package-manager caching in release builds, and GitHub recommends granting workflows only the permissions they require.

The exact current stable major versions of `actions/checkout` and `actions/setup-node` should be checked during implementation. As of July 31, 2026, version 7 is the latest published major for both actions.

## Prereleases

The initial workflow should not publish GitHub prereleases.

Publishing prerelease versions correctly requires choosing an npm distribution tag such as:

```bash
npm publish --tag next
```

Using the default `latest` tag for a prerelease can unintentionally make that prerelease the default installed version.

Prerelease automation may be added later as a deliberate feature. It should not be inferred automatically from a GitHub prerelease checkbox without corresponding tests and documentation.

---

# Initial publication and Trusted Publishing bootstrap

## Current bootstrap limitation

Trusted Publishing is configured from the settings page of an existing npm package. npm’s current documentation begins by directing maintainers to the package’s settings page, and an open npm documentation issue reports that attempting the first publication of a previously nonexistent package through OIDC fails.

The initial version should therefore be treated as a one-time bootstrap operation.

## Recommended bootstrap process

The simplest process is:

1. Complete the package and run:

   ```bash
   npm run verify
   ```

2. Inspect the package:

   ```bash
   npm pack --dry-run
   ```

3. Sign in to npm locally with an account protected by two-factor authentication.

4. Publish the initial version manually:

   ```bash
   npm publish --access public
   ```

5. Open the npm settings for `eslint-plugin-compact-guards`.

6. Configure its Trusted Publisher with:

   ```text
   Provider: GitHub Actions
   GitHub organization or user: <repository owner>
   Repository: <repository name>
   Workflow filename: publish.yml
   Environment: none
   Allowed action: npm publish
   ```

   npm requires only the workflow filename, not the `.github/workflows/` path. The filename must exactly match the configured workflow.

7. Run the next release through GitHub Actions.

8. After confirming that Trusted Publishing works, set npm publication access to:

   ```text
   Require two-factor authentication and disallow tokens
   ```

npm recommends disabling traditional token publication after Trusted Publishing has been verified.

All releases after the bootstrap publication should be performed through GitHub Actions.

## Alternative bootstrap process

The initial publication could instead use a temporary granular npm token stored in GitHub Actions. That process would require:

1. creating a narrowly scoped publication token;
2. storing it as a temporary GitHub secret;
3. publishing the first release through the workflow;
4. configuring Trusted Publishing;
5. deleting the GitHub secret;
6. revoking the npm token;
7. removing token-related workflow configuration.

This is more complicated and temporarily introduces a long-lived credential. It is therefore not the recommended default.

---

# npm Trusted Publisher configuration

The Trusted Publisher must match the workflow identity exactly:

```text
Package: eslint-plugin-compact-guards
Provider: GitHub Actions
Repository owner: actual GitHub owner
Repository: actual repository name
Workflow filename: publish.yml
Allowed operation: npm publish
```

If a GitHub Environment is later added to the workflow:

```yaml
jobs:
  publish:
    environment: npm
```

the same environment name must also be entered in npm’s Trusted Publisher configuration.

A GitHub Environment may be useful when an additional required-reviewer gate is desired. It is optional because publishing a GitHub Release already provides a straightforward manual release action. GitHub environments can require reviewer approval before a job proceeds.

Each npm package currently supports one Trusted Publisher configuration at a time.

---

# Version and tag requirements

Every npm publication must use a previously unpublished version.

The GitHub Release tag must exactly equal:

```text
v<package.json version>
```

Examples:

```text
package.json version: 0.1.0
GitHub tag:          v0.1.0
```

```text
package.json version: 1.2.3
GitHub tag:          v1.2.3
```

Invalid examples:

```text
package.json version: 1.2.3
GitHub tag:          1.2.3
```

```text
package.json version: 1.2.3
GitHub tag:          v1.2.4
```

Once a particular package name and version have been published, that exact combination cannot be reused, even after unpublishing.

The publication workflow must fail before `npm publish` when the tag and package version differ.

---

# Failure and retry behavior

`npm publish` should be the final workflow step.

This has two consequences:

1. A failure before the publication step can be corrected and the workflow rerun safely.
2. A successful publication will not be followed by another step that might fail and make the overall job appear unsuccessful.

When a publication succeeds, rerunning the workflow for the same version will fail because npm does not permit republishing an existing version. That is expected behavior.

A failed release must not be “fixed” by deleting and recreating the same npm version. Instead:

1. correct the package;
2. increment its version;
3. create a new GitHub Release.

---

# GitHub Actions dependency maintenance

The repository should use Dependabot to keep GitHub Actions references current.

Suggested configuration:

```yaml
version: 2

updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

GitHub recommends Dependabot as a way to keep actions and reusable workflow references updated with fixes and security improvements.

Pinning actions to complete commit hashes is an optional additional hardening measure. Using maintained major-version references for GitHub’s first-party actions is acceptable for the straightforward baseline described here, provided updates are reviewed and applied regularly.

---

# Publication acceptance criteria

The release system is ready when:

1. `.github/workflows/ci.yml` runs the supported compatibility matrix.
2. `.github/workflows/publish.yml` is committed to the default branch.
3. The publication workflow runs only from a published GitHub Release.
4. The workflow checks out the exact release tag.
5. The release tag must match `v<package.json version>`.
6. GitHub prereleases are not accidentally published as `latest`.
7. The publication job uses a GitHub-hosted runner.
8. The publication job has `contents: read`.
9. The publication job has `id-token: write`.
10. No npm publication token is stored after bootstrap.
11. The workflow uses an npm version that supports Trusted Publishing.
12. The workflow runs `npm ci`.
13. The workflow runs the full verification suite.
14. The packed-package smoke test passes before publication.
15. `npm publish` is the final step.
16. The package’s npm Trusted Publisher references the correct repository and `publish.yml`.
17. Provenance appears on packages published through the workflow.
18. The npm package is configured to require two-factor authentication and disallow traditional publication tokens after OIDC has been verified.
19. A test release successfully installs from npm using both ESM and CommonJS entry points when both are advertised.
20. The release process and bootstrap exception are documented in `CONTRIBUTING.md` or the README.

These requirements describe the intended release guarantees. Workflow syntax, action versions, script organization, and supporting tools may be adjusted when a cleaner implementation provides the same or stronger guarantees.
