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

git checkout develop
git pull --ff-only origin develop

if [ -f ".changeset/pre.json" ]; then
  echo "Removing .changeset/pre.json from develop to keep stable flow out of prerelease mode."
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

git checkout main
git pull --ff-only origin main

if [ -f ".changeset/pre.json" ]; then
  echo "Removing .changeset/pre.json from main to keep stable releases in normal mode."
  git rm .changeset/pre.json
  git commit -m "chore: remove prerelease mode file from main"
fi

if git merge-base --is-ancestor origin/develop HEAD; then
  echo "main already contains origin/develop. Nothing to merge."
else
  git merge --no-ff --no-edit origin/develop
fi

git push origin main

git checkout develop

cat <<'EOF'
Stable release preparation completed.
Next step: merge the `changeset-release/main` PR created by GitHub Actions.
EOF
