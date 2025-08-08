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

# Exclude any OS or editor files
echo "Zipping the following files into $ZIP_NAME:"
find "$EXT_DIR" \
  -type f \
  ! -name '*.DS_Store' \
  ! -name '.git*' \
  ! -path '*/.git/*' \
  ! -name '.vscode*' \
  ! -path '*/.vscode/*'

zip -r "$ZIP_NAME" "$EXT_DIR" \
  -x "*.DS_Store" \
  -x "*/.DS_Store" \
  -x "*.git*" \
  -x "*/.git*" \
  -x "*.vscode*" \
  -x "*/.vscode*"

echo "Packaged as $ZIP_NAME. Ready for upload to Chrome Web Store."
