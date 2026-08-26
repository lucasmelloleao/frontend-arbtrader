---
name: workflow-feature-expansion
description: "Use quando o usuário digitar 'expand', 'expandir', 'escalar', 'adicionar aba', 'nova seção', 'novo modal', 'nova tela', 'add tab', 'new section', ou passar uma issue para adicionar capacidade a uma feature existente. Sintomas: a feature já existe e vai ganhar mais um fluxo/tela/aba."
---

# Workflow: Feature Expansion

## Visão geral

Adicionar capacidade a feature existente. Não é greenfield (a feature já existe) nem refactor (a estrutura geral fica). É **adição cirúrgica**: novo arquivo cai no lugar certo, sem vazar responsabilidade.

**Referência cruzada (núcleo):** `layer-boundaries`, `api-contract`, `no-barrel-policy`, `naming-conventions`.
**Específico da stack:** `nextjs-react19-architecture` define onde cada arquivo cai (`features/<dom>/` com `*.schema.ts`, componentes folha, server actions; rotas em `src/app/**`, sem `*.screen.tsx`) e o padrão de data-fetching (leitura = RSC, mutação = Server Action).

## Quando usar

- Nova aba, seção, card, modal, painel em feature existente
- Novo form flow, action, mutation
- Nova visualização variante, filtro, step
- Extensão que NÃO exige restruturar a feature

## Quando NÃO usar

- Feature precisa de restruturação ampla → `workflow-refactor`
- Construir do zero → `workflow-new-feature`

## Princípios

- Manter a feature **reconhecível** na árvore atual.
- Adicionar sem **vazar responsabilidade** pra outras features.
- KISS/YAGNI: adiciona o mínimo; cada layer/hook novo serve necessidade concreta presente (`core-principles`).
- Consolida duplicação que você **TOCAR** (não sai consertando fora do escopo).
- **Reuse first**: antes de criar helper/componente, varrer utils centrais, design system e a própria feature.
- Error handling humanizado (`core-principles`); `api-contract` nos endpoints novos.
- O resto (camadas, sem-barrel, naming, cache, fetch-no-componente) é **imposto por lint**: rode `bun run lint`. Estrutura e data-fetching: `nextjs-react19-architecture`.

## Fase 0: gate de viabilidade

### 0.1 Avaliar estado atual

1. Ler a árvore da feature.
2. Identificar onde a nova capability cai.
3. Checar se types/hooks/server actions existentes podem ser estendidos vs criar novos.
4. Verificar compliance atual (naming, barrels presentes a remover).

### 0.2 Análise paralela (2 frentes)

**Frente 1: Feature audit:** árvore atual, organização de types/components/hooks, leitura (RSC) e mutação (Server Actions) em uso, test coverage.

**Frente 2: Integration points:** quais endpoints novos? → ativar `api-contract` para mapear cada um no spec. Quais chamadas em `lib/api` estendem vs novas? Navegação/roteamento muda? Que componentes do design system reutilizar?

**Gate**: aguardar aprovação.

## Fase 1: plano de expansão

Produzir:

1. **Árvore atualizada**: mostrar additions no contexto da árvore existente
2. **Lista de novos arquivos**: naming correto, sem barrels
3. **Lista de arquivos modificados**: o que muda em cada um
4. **Type additions**: em qual arquivo de `types/` cada novo tipo entra
5. **Nova leitura/mutação**: leitura via RSC (`apiClient`), mutação via Server Action → `revalidatePath`/`router.refresh`
6. **Component placement**: conforme `nextjs-react19-architecture`
7. **Tests plan**: novos testes necessários

**Gate**: aguardar aprovação.

## Fase 2: implementação (ordem de expansão)

0. **Reuse scan**: antes de codar, checar se algo similar já existe (utils centrais, design system, a própria feature). Promove pro core o que ficar genérico.
1. Types (adicionar em arquivos existentes ou criar novos)
2. Schemas (`*.schema.ts` com valibot, tipo via `InferOutput`, vide `api-contract`)
3. `lib/api` (estender ou criar chamadas via `ky`/`apiClient` com JSDoc + `Endpoint:` + `Source:`)
4. RSC + Server Actions (leitura no Server Component; mutação → `revalidatePath`/`router.refresh`)
5. Components (folha `'use client'` só para interatividade)
6. Rotas (`src/app/**`, adicionar/ajustar se necessário; sem `*.screen.tsx`)
7. Tests

## Fase 3: verificação

- [ ] Árvore ainda limpa e **reconhecível**
- [ ] Sem **vazamento de responsabilidade** pra outras features
- [ ] Nenhum helper/utility **duplicado** de algo que já existia (reuse scan)
- [ ] Error handling humanizado; `api-contract` aplicada nos endpoints novos
- [ ] `bun run verify && bun run build` passa (cobre camadas, barrel, cache, naming, dead code, formato)

## Sinais de alerta: PARE

- Criar `helpers/` no root da feature "pra essa coisa específica": usar `utils/` (existente).
- Manter cache de servidor no client em vez de deixar o RSC fresco e revalidar (`revalidatePath`/`router.refresh`).
- Adicionar barrel "pra organizar".
- Tocar em outra feature pra "deixar consistente": fora do escopo, faz separado.

## Racionalizações comuns

| Desculpa                                                                | Realidade                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| "É só um modal, posso pôr o data-fetching direto"                       | Mesmo modal, mesma regra de `layer-boundaries`. Hook ou pai. |
| "Esse novo endpoint é parecido com o existente, não preciso ler o spec" | Parecido não é igual. Abre o spec.                          |
| "Vou criar um barrel só pra esses novos exports"                        | Não. Imports path completo.                                 |
| "Já que estou aqui, refatoro essa parte velha também"                   | Não. Fora do escopo. Vira outra task.                       |
