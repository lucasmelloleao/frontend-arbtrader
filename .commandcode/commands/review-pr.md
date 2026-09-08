---
description: Analisa e responde comentários de review em PR
argument-hint: <pr-url>
---

# Review PR

Entrada: $ARGUMENTS

Ativa: `pr-review-response`.

Executa as 4 fases definidas em `pr-review-response` (Phase 0 context/checkout → Phase 1 collect → Phase 2 classify FIX/JUSTIFY/PARTIAL → Phase 3 apply → Phase 4 respond via GH API). Aguardar aprovação do usuário entre cada fase crítica. Não duplicar regras aqui.
