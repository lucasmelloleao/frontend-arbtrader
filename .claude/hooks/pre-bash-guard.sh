#!/usr/bin/env bash
# Pre-Bash hook: bloqueia comandos destrutivos antes de executar.
# Lê JSON do stdin (tool_input.command). Exit 0 = permite, Exit 2 = bloqueia.
# Parse via `bun` (runtime garantido da stack, sem depender de jq).

set -uo pipefail

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | bun -e 'try { process.stdout.write(JSON.parse(await Bun.stdin.text())?.tool_input?.command ?? "") } catch {}')

[ -z "$COMMAND" ] && exit 0

# 1. Padrões destrutivos por substring
BLOCKED=(
  "rm -rf /"
  "rm -rf ~"
  "git reset --hard"
  "git clean -f"
  "sudo "
  "chmod 777"
  "cat .env"
)
for p in "${BLOCKED[@]}"; do
  if [[ "$COMMAND" == *"$p"* ]]; then
    echo "BLOCKED: comando casa padrão destrutivo: $p" >&2
    exit 2
  fi
done

# 2. Force-push: bloqueia --force / -f, mas PERMITE --force-with-lease / --force-if-includes (seguros)
if [[ "$COMMAND" =~ git[[:space:]]+push.*(--force([[:space:]]|$)|[[:space:]]-f([[:space:]]|$)) ]] \
   && [[ ! "$COMMAND" =~ (--force-with-lease|--force-if-includes) ]]; then
  echo "BLOCKED: git push --force (use --force-with-lease)" >&2
  exit 2
fi

# 3. Execução remota: download canalizado para shell (curl ... | bash / wget ... | sh)
if [[ "$COMMAND" =~ (curl|wget)[^|]*\|[^|]*(bash|sh|zsh) ]]; then
  echo "BLOCKED: pipe de download para shell (curl|bash)" >&2
  exit 2
fi

exit 0
