#!/usr/bin/env bash
#
# Builds the release bundle and installs it to /Applications, replacing any
# previous copy, so the Dock icon always points at the current code.
#
# Usage: npm run release

set -euo pipefail

APP_NAME="novello"
DEST="/Applications/${APP_NAME}.app"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILT="${ROOT}/src-tauri/target/release/bundle/macos/${APP_NAME}.app"

# rustup's PATH export lives in ~/.zshrc, which non-interactive shells skip.
export PATH="${HOME}/.cargo/bin:${PATH}"

cd "$ROOT"

echo "==> Building ${APP_NAME}"
# Only the .app target: the .dmg step needs a signing identity we don't have.
npm run tauri build -- --bundles app

if [ ! -d "$BUILT" ]; then
  echo "Build finished but ${BUILT} is missing." >&2
  exit 1
fi

# A running copy holds its binary open, so replacing it in place would leave
# the old process on a deleted inode until the user quits it.
if pgrep -f "${DEST}/Contents/MacOS/${APP_NAME}" >/dev/null 2>&1; then
  echo "==> Quitting the running ${APP_NAME}"
  osascript -e "tell application \"${DEST}\" to quit" >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do
    pgrep -f "${DEST}/Contents/MacOS/${APP_NAME}" >/dev/null 2>&1 || break
    sleep 0.25
  done
  pkill -f "${DEST}/Contents/MacOS/${APP_NAME}" >/dev/null 2>&1 || true
fi

echo "==> Installing to ${DEST}"
rm -rf "$DEST"
cp -R "$BUILT" "$DEST"

# Tauri leaves only the linker's ad-hoc signature on the binary, with no bundle
# signature, which Gatekeeper rejects. Re-signing ad-hoc is enough locally.
echo "==> Signing"
codesign --force --deep --sign - "$DEST"
codesign --verify --deep --strict "$DEST"

echo "==> Done. ${DEST} is up to date."
echo "    Launch it from the Dock, or: open \"${DEST}\""
