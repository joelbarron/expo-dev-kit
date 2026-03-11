#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CHANGESET_COMMIT_MESSAGE="${CHANGESET_COMMIT_MESSAGE:-chore: add changeset for release}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

git fetch origin

if ! git show-ref --verify --quiet refs/remotes/origin/develop; then
  echo "Missing branch origin/develop."
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  echo "Missing branch origin/main."
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/next; then
  echo "Missing branch origin/next."
  exit 1
fi

if ! git show origin/next:.changeset/pre.json >/dev/null 2>&1; then
  echo "Missing .changeset/pre.json on next. Initialize prerelease mode on branch 'next' first."
  exit 1
fi

git checkout develop
git pull --ff-only origin develop

if [ -f ".changeset/pre.json" ]; then
  echo "Removing .changeset/pre.json from develop to avoid prerelease mode leakage."
  git rm .changeset/pre.json
  git commit -m "chore: remove prerelease mode file from develop"
fi

CHANGESET_COUNT="$(git diff --name-only origin/main...HEAD -- ':(glob).changeset/*.md' | wc -l | tr -d ' ')"
if [ "$CHANGESET_COUNT" -eq 0 ]; then
  echo "No pending changeset found in develop. Starting Changeset wizard..."
  npx changeset add

  git add .changeset
  if git diff --cached --quiet; then
    echo "No changeset file was created. Aborting."
    exit 1
  fi

  git commit -m "$CHANGESET_COMMIT_MESSAGE"
fi

git push origin develop

git checkout next
git pull --ff-only origin next

if git merge-base --is-ancestor origin/develop HEAD; then
  echo "next already contains origin/develop. Nothing to merge."
else
  git merge --no-ff --no-edit origin/develop
fi

if [ ! -f ".changeset/pre.json" ]; then
  echo "Re-entering prerelease mode on next (rc)."
  npx changeset pre enter rc
  git add .changeset/pre.json
  git commit -m "chore: enter rc prerelease mode on next"
fi

git push origin next

git checkout develop

cat <<'EOF'
RC release preparation completed.
Next step: merge the `changeset-release/next` PR created by GitHub Actions.
EOF
