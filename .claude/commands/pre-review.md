---
description: Pré-review de guardrails da branch antes do PR; grava o selo que libera o gh pr create
argument-hint: "[base] (padrão: main)"
---

# Pré-review

Entrada: $ARGUMENTS (base do PR; vazio = a base da seção *Branch base* do `CLAUDE.md`)

Pré-requisito: rodar `/pr-ready` primeiro. Esta skill é julgamento, não gate mecânico.

Ativa: `pre-review`.

Executa o fluxo definido em `.agents/skills/pre-review/SKILL.md` (escopo → reviewers por
domínio em paralelo → revalidação no contexto principal → relatório → selo por HEAD).
Não duplicar regras aqui.

Saída: relatório por categoria/severidade + selo `.agents/tmp/pre-review-<HEAD>.ok` gravado
só após sua confirmação. Sem o selo, `pre-pr-review-gate.ts` bloqueia o `gh pr create`.
