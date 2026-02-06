#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
HOST_PY="$ROOT/host.py"
MANIFEST_SRC="$ROOT/com.localai.launcher.json"
MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
MANIFEST_DST="$MANIFEST_DIR/com.localai.launcher.json"

if [[ ! -f "$HOST_PY" ]]; then
  echo "host.py not found"
  exit 1
fi

if [[ -z "${1:-}" ]]; then
  echo "Usage: ./install-mac.sh <EXTENSION_ID>"
  exit 1
fi

EXT_ID="$1"
mkdir -p "$MANIFEST_DIR"
sed \
  -e "s|REPLACE_WITH_ABSOLUTE_PATH_TO_host.py|$HOST_PY|g" \
  -e "s|REPLACE_WITH_EXTENSION_ID|$EXT_ID|g" \
  "$MANIFEST_SRC" > "$MANIFEST_DST"

chmod +x "$HOST_PY"
echo "Installed native host manifest:"
echo "$MANIFEST_DST"
