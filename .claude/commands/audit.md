---
description: Auditoria arquitetural completa de uma feature
argument-hint: src/features/<feature>
---

# Auditoria Arquitetural

Entrada: $ARGUMENTS

Ativa: `feature-audit`, `layer-boundaries`, `no-barrel-policy`, `nextjs-react19-architecture`, `naming-conventions`, `gitnexus-impact-analysis` (opcional: ver integracoes/gitnexus.md).

Executa as 6 fases definidas em `feature-audit` (Phase 0 Impact Pre-Flight → Phase 5 Code Quality) no path fornecido. Saída: relatório estruturado por fase com veredito READY / NEEDS FIXES.
