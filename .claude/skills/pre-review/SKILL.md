---
name: pre-review
description: "Use antes de abrir PR, quando o usuário disser 'pré-review', 'revisa antes do PR', ou quando o gate de `gh pr create` reclamar do selo ausente. Revisa a branch contra a base procurando over-engineering, fallback defensivo, regra de negócio inventada no front e slop — o julgamento que lint/knip/teste não pegam."
argument-hint: "[base] (padrão: main)"
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(mkdir *), Read, Grep, Glob, Agent, AskUserQuestion
---

# Pré-review de guardrails

Leia completamente e siga a skill canônica em
`.agents/skills/pre-review/SKILL.md`. Use o argumento recebido como base; quando
estiver vazio, use a base definida na seção *Branch base* do `CLAUDE.md`
(default `main`).

A skill canônica mora em `.agents/` porque é compartilhada entre Claude Code,
Codex e Cursor — este arquivo é só o registro dela no Claude Code.
