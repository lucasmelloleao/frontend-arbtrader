---
description: Revisão de código semântica em 6 fases (inclui impact pre-flight)
argument-hint: <KEY> ou src/features/auth
---

# Code Review

Entrada: $ARGUMENTS

Ativa: `feature-audit`, `api-contract`, `layer-boundaries`, `no-barrel-policy`, `nextjs-react19-architecture`, `naming-conventions`, `core-principles`, `typescript-strict`, `gitnexus-impact-analysis` (opcional: ver integracoes/gitnexus.md).

Se input for uma chave de issue, buscar no tracker (ex.: Jira via MCP Atlassian) para alinhar com acceptance criteria. Se input for path, revisar direto.

Executa as 6 fases definidas em `feature-audit` (Phase 0 Impact Pre-Flight → Phase 5 Code Quality). Saída: relatório com veredito READY / NEEDS FIXES + issues ordenadas por severidade.
