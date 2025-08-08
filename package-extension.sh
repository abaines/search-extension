#!/usr/bin/env bash
# Package the extension for Chrome Web Store upload
# Usage: ./package-extension.sh
# Compatible with local and CI (GitHub Actions) environments

set -euo pipefail

EXT_DIR="extension"
ZIP_NAME="search-extension-chrome.zip"

if [ ! -d "$EXT_DIR" ]; then
  echo "Error: '$EXT_DIR' directory not found."
  exit 1
fi

rm -f "$ZIP_NAME"


# Build the list of files to include (single source of truth), stripping the extension/ prefix
INCLUDE_LIST=".package-include-files.txt"
find "$EXT_DIR" \
  -type f \
  ! -name '*.DS_Store' \
  ! -name '.git*' \
  ! -path '*/.git/*' \
  ! -name '.vscode*' \
  ! -path '*/.vscode/*' \
  | sed "s|^$EXT_DIR/||" > "$INCLUDE_LIST"

echo "Zipping the following files into $ZIP_NAME:"
cat "$INCLUDE_LIST"

# Change to extension directory and zip contents at root of zip
(cd "$EXT_DIR" && zip "../$ZIP_NAME" -@ < "../$INCLUDE_LIST")

rm -f "$INCLUDE_LIST"

echo "Packaged as $ZIP_NAME. Ready for upload to Chrome Web Store."
