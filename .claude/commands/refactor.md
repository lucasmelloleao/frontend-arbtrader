---
description: Inicia workflow de refatoração com gate de infraestrutura, diagnóstico e plano de ataque
argument-hint: <KEY> ou src/features/<feature>
---

# Refatorar

Entrada: $ARGUMENTS

Ativa: `workflow-refactor`, `layer-boundaries`, `api-contract`, `no-barrel-policy`, `nextjs-react19-architecture`, `naming-conventions`, `core-principles`, `typescript-strict`, `gitnexus-impact-analysis` (opcional: ver integracoes/gitnexus.md).

Se for upgrade de framework/SDK ou migração da camada de data-fetching, ative também `nextjs-react19-architecture` e `vercel-react-best-practices`.

Executa o workflow definido em `workflow-refactor` (gates de Phase 0 → 4). Não duplicar regras aqui: tudo está nas skills ativadas.
