#!/bin/bash
echo "# Codemap (auto-generated)" > CODEMAP.md
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> CODEMAP.md
echo "" >> CODEMAP.md

# Find the source directory
SRC_DIR=""
for dir in src app lib pkg cmd; do
  [ -d "$dir" ] && SRC_DIR="$dir" && break
done

if [ -z "$SRC_DIR" ]; then
  echo "No source directory found (checked: src, app, lib, pkg, cmd)" >> CODEMAP.md
  exit 0
fi

find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.js" -o -name "*.jsx" -o -name "*.rs" -o -name "*.java" -o -name "*.kt" \) 2>/dev/null | sort | while read f; do
  LINES=$(wc -l < "$f")
  echo "### $f ($LINES lines)" >> CODEMAP.md
  grep -E "^export |^export default|^def |^func |^class |^interface |^type |^enum |^pub fn |^pub struct " "$f" 2>/dev/null | head -15 >> CODEMAP.md
  echo "" >> CODEMAP.md
done
