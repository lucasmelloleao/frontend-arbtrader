#!/usr/bin/env bash
# Post-Write/Edit hook: roda oxlint no arquivo TS alterado. Exit 0 sempre (informativo).
# Parse via `bun` (runtime garantido da stack, sem depender de jq).

set -uo pipefail

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | bun -e 'try { process.stdout.write(JSON.parse(await Bun.stdin.text())?.tool_input?.file_path ?? "") } catch {}')

[ -z "$FILE_PATH" ] && exit 0

# Só lint em TypeScript sob src/ ou app/
case "$FILE_PATH" in
  *src/*.ts|*src/*.tsx|*app/*.ts|*app/*.tsx)
    if command -v bunx >/dev/null 2>&1; then
      bunx oxlint --disable-nested-config "$FILE_PATH" 2>&1 || true
    fi
    ;;
esac

exit 0
