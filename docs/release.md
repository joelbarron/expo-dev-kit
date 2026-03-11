# Release Guide (npm + Changesets)

This repo uses Changesets with two channels:
- `latest` from branch `main` (stable)
- `next` from branch `next` (rc prerelease)

## One-time setup

1. Configure npm Trusted Publisher for package `@joelbarron/expo-dev-kit`.
2. Point it to this repository and workflow `.github/workflows/release.yml`.
3. Remove `NPM_TOKEN` secret after OIDC is validated.

## Branch bootstrap for prerelease channel

Run once to initialize `next` in prerelease mode:

```bash
git checkout main
git pull
git checkout -b next
npx changeset pre enter rc
git add .changeset/pre.json
git commit -m "chore: enter rc prerelease mode on next"
git push -u origin next
```

Important:
- `.changeset/pre.json` should exist only in `next`.
- `main` should not keep `.changeset/pre.json`.

## Daily release flow

1. Work on `develop` and commit your code changes.
2. Choose release mode:
   - Stable: `npm run release:stable` (`develop -> main`)
   - RC: `npm run release:rc` (`develop -> next`)
3. If no pending changeset exists, the script runs `npx changeset add` and commits it automatically.
4. Wait for release PR:
   - `changeset-release/main` (stable)
   - `changeset-release/next` (rc)
5. Merge release PR to publish.

## Validation

```bash
npm run pack:verify
npm view @joelbarron/expo-dev-kit version dist-tags --json
```
