---
name: feature-audit
description: "Use quando o usuário pedir review de código, validar implementação, auditar feature, ou digitar 'review', 'revisar', 'check implementation', 'code review'. Sintomas: PR pronto, feature implementada, issue entregue, vai validar antes de mergear."
---

# Feature Audit

## Visão geral

**feature-audit = auditoria SEMÂNTICA**: impact pre-flight (GitNexus), alinhamento com acceptance criteria / scope creep, espelhamento de contrato 1:1, layer semantics e relatório por severidade. O mecânico (lint, dead code, JSDoc, naming, contract-invoke, diff scope, secrets) vive no `pr-ready`: não duplicar aqui. **Pré-requisito: `pr-ready` verde.**

Revisão estruturada de PR/feature. Cada fase olha uma dimensão. Saída final: READY ou NEEDS FIXES com lista de issues por severidade.

**Referência cruzada (núcleo):** `api-contract`, `layer-boundaries`, `no-barrel-policy`, `naming-conventions`, `core-principles`, `typescript-strict`.
**Estendido pela stack (Next.js App Router + RSC):** checagens específicas de padrões de componente, data-fetching (RSC/Server Actions), bordas com valibot e acessibilidade web.
**Opcional (terceiros):** se você usa GitNexus, faça o pré-voo de impacto (ver `integracoes/gitnexus.md`).

## Quando usar

- PR aberto pronto para review
- Após `/refactor`, `/new-feature`, `/expand` para validar
- Issue entregue para verificar acceptance criteria

## Quando NÃO usar

- Code review durante implementação ("ainda vou mudar"): espera terminar
- Para um único arquivo trivial: análise direta sem workflow

## Fase 0 (opcional): impact pre-flight

Se o projeto usa **GitNexus** (ver `integracoes/gitnexus.md`), mapeie o blast radius dos símbolos
tocados ANTES das demais fases: `detect_changes` no diff e `impact` (direction upstream) em cada
símbolo crítico (Function/Class/Method em código de domínio/core). Produza uma tabela de blast
radius no topo do relatório; símbolos com risco CRITICAL/HIGH exigem comentário explícito sobre
teste/cobertura/rollback: sem isso, veredito **NEEDS FIXES**.

Sem GitNexus: pule esta fase ou faça o mapeamento manual dos call-sites dos símbolos exportados que
mudaram.

## Fase 1: alinhamento com requisitos

- Issue/ticket fornecido → buscar acceptance criteria
- Comparar implementação × acceptance criteria
- Flag missing requirements ou scope creep
- **Saída:** ALIGNED / GAPS (lista)

## Fase 2: estrutura da feature

- Comparar com a estrutura canônica `app → features → lib → shared`
- Arquivos no lugar certo (components, types, schemas, hooks, server actions)
- Tipos separados por concern quando há múltiplos (`api.types.ts` / `domain.types.ts` / `ui.types.ts`)
- **Saída:** COMPLIANT / VIOLATIONS (file paths)

## Fase 3: arquitetura & layer compliance

Ativar `layer-boundaries`. Para cada arquivo modificado:

- [ ] Components puros (sem data-fetching/efeitos de fetch dentro do componente)
- [ ] Sem sub-componente declarado inline
- [ ] Sem constantes inline em componente
- [ ] Hooks sem markup
- [ ] Leitura via Server Component + `apiClient` (sem React Query/SWR, sem cache)
- [ ] Mutação via Server Action → `revalidatePath`/`router.refresh`
- [ ] Server Actions com validação (valibot) no boundary + JSDoc
- [ ] Mappers puros em `utils/`
- [ ] Schemas sem transform de UI
- [ ] Mensagens user-facing via constante PT-BR (não `error.message` cru)
- [ ] Tratamento de erro/loading nos limites (error boundary + estado de loading)
- **Saída:** COMPLIANT / ISSUES (severidade)

> Checks específicos da stack: boundaries entre Server e Client Components, `next/image`,
> Server Actions e ausência de cache (`'use cache'`/`revalidate>0` proibidos).

## Fase 4: sincronização de contrato API

Ativar `api-contract`. Para cada `*.schema.ts` / `api.types.ts` modificado:

- [ ] Spec do endpoint localizado em `$API_CONTRACT_PATH`
- [ ] Tipos espelham o spec 1:1 (campos, nullability, optionality)
- [ ] valibot valida request + response (`*.schema.ts`), mensagens em PT-BR
- [ ] JSDoc da chamada (`lib/api`/Server Action) cita `Endpoint:` + `Source:`
- [ ] Mappers explícitos onde API ↔ domain divergem
- [ ] Update order respeitada (types → schemas → mappers → apiClient → UI)
- **Saída:** ALIGNED / MISMATCHES (lista)

## Fase 5: qualidade de código (semântica)

- [ ] Early returns (sem if-else aninhado)
- [ ] Sem magic string/number
- [ ] YAGNI (sem over-engineering, sem código "pro futuro")
- [ ] Toda prop opcional tem default explícito OU JSDoc explicando por quê
- [ ] Toda chamada HTTP rota erro pelo pipeline central
- **Saída:** CLEAN / ISSUES (file:line)

## Relatório final

```
# Feature Audit Report

**Feature**: <nome>
**Reviewer**: Claude Code
**Date**: <data>

## Summary
| Phase | Status |
|-------|--------|
| 0. Impact Pre-Flight | MAPPED (risk: …) / N/A |
| 1. Requirements | ALIGNED / GAPS |
| 2. Feature Structure | COMPLIANT / VIOLATIONS |
| 3. Architecture/Layers | COMPLIANT / ISSUES |
| 4. API Contract | ALIGNED / MISMATCHES |
| 5. Code Quality | CLEAN / ISSUES |

## Verdict: READY / NEEDS FIXES

## Issues (se houver)
[Ordenadas: Critical → Major → Minor]
```

## Sinais de alerta durante a review: PARE

- Vontade de "deixar passar pequeno detalhe": anota como Minor mas anota
- Encontrou violação de `layer-boundaries` mas o dev disse "depois eu corrijo": registra como Major
- Schema sem confirmação do spec: Major
