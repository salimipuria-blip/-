#!/usr/bin/env bash
# نصب مهارت‌ها در Claude Code — bash install.sh [مسیر-پروژه]
set -e
if [ -n "$1" ]; then DEST="$1/.claude/skills"; else DEST="$HOME/.claude/skills"; fi
mkdir -p "$DEST"
cp -r "$(dirname "$0")/skills/"* "$DEST/"
echo "✅ نصب شد در: $DEST — تعداد: $(ls "$DEST" | wc -l) مهارت"
