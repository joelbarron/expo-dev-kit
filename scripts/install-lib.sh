#!/usr/bin/env bash
set -euo pipefail

SOURCE=""
TARGET=""
TAG="latest"
SKIP_BUILD="false"

usage() {
  cat <<USAGE
Usage:
  bash scripts/install-lib.sh --source <local|npm> --target <path> [--tag <tag_or_version>] [--skip-build]

Examples:
  bash scripts/install-lib.sh --source local --target /Users/joel_barron/Developer/usbix/finzenio/finzenio-app
  bash scripts/install-lib.sh --source npm --target /Users/joel_barron/Developer/usbix/finzenio/finzenio-app --tag latest
  bash scripts/install-lib.sh --source npm --target /Users/joel_barron/Developer/usbix/finzenio/finzenio-app --tag 0.1.0
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE="${2:-}"
      shift 2
      ;;
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    --tag)
      TAG="${2:-}"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$SOURCE" || -z "$TARGET" ]]; then
  usage
  exit 1
fi

if [[ "$SOURCE" != "local" && "$SOURCE" != "npm" ]]; then
  echo "Error: --source must be local or npm"
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  echo "Error: target does not exist: $TARGET"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG_NAME="$(node -p "require('${ROOT_DIR}/package.json').name")"

if [[ "$SKIP_BUILD" != "true" ]]; then
  echo "[1/3] Typecheck + build library"
  (cd "$ROOT_DIR" && npm run typecheck && npm run clean && npm run build)
else
  echo "[1/3] Skipping build (--skip-build)"
fi

if [[ "$SOURCE" == "local" ]]; then
  echo "[2/3] Packing local package"
  PACK_FILE="$(cd "$ROOT_DIR" && npm pack --silent)"
  PACK_PATH="$ROOT_DIR/$PACK_FILE"

  echo "[3/3] Installing local package into $TARGET"
  (cd "$TARGET" && npm install "$PACK_PATH")

  rm -f "$PACK_PATH"
  echo "Done: installed $PKG_NAME from local pack"
else
  echo "[2/3] Resolving npm package"
  PACKAGE_REF="${PKG_NAME}@${TAG}"

  echo "[3/3] Installing $PACKAGE_REF into $TARGET"
  (cd "$TARGET" && npm install "$PACKAGE_REF")

  echo "Done: installed $PACKAGE_REF from npm"
fi
