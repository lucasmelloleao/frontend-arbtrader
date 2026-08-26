---
name: workflow-new-feature
description: "Use quando o usuário digitar 'new feature', 'nova feature', 'criar feature', 'greenfield', ou passar uma issue para uma feature que ainda não existe. Sintomas: nenhum arquivo da feature ainda, requisitos novos, tela/fluxo inédito."
---

# Workflow: New Feature (Greenfield)

## Visão geral

Feature do zero. Fase de viabilidade obrigatória ANTES de qualquer código. Cada fase tem gate explícito de aprovação. Skills arquiteturais (`layer-boundaries`, `no-barrel-policy`, `api-contract`) ativadas desde o início: não no fim.

**Referência cruzada (núcleo):** `layer-boundaries`, `api-contract`, `no-barrel-policy`, `naming-conventions`, `core-principles`, `typescript-strict`, `deep-interview`.
**Específico da stack:** `nextjs-react19-architecture` define a árvore canônica de feature (`features/<dom>/` com `*.schema.ts`, componentes e server actions: sem `api/queries|mutations|adapters`, sem `services/`, sem `screens/`), o padrão de data-fetching (leitura = RSC, mutação = Server Action) e os componentes de UI. Performance (RSC/waterfall/bundle): `vercel-react-best-practices`.

## Quando usar

- Feature inédita (a pasta da feature não existe ainda)
- Issue cuja descrição implica módulo novo
- Início de épico

## Quando NÃO usar

- Estender feature existente → `workflow-feature-expansion`
- Reescrever feature existente → `workflow-refactor`
- Bug fix → corrigir direto

## Restrições

A arquitetura é **imposta por lint** (`bun run lint`) + as skills `layer-boundaries`, `no-barrel-policy`, `api-contract`, `typescript-strict` e `core-principles` (JSDoc em exports, erro humanizado, testes de comportamento em PT-BR). Não relisto aqui. Pontos de processo que o lint não pega: validação na borda 1:1 com o contrato (`api-contract`) e **reuse scan** antes de criar helper/componente novo.

### NUNCA

- Assumir regra de negócio sem confirmar (ver `deep-interview`)
- Pular Phase 0 (Feasibility Gate)
- Escrever código antes de Phase 1 aprovada

## Fase 0: gate de viabilidade

### 0.1 Descoberta

Input com issue → buscar título, descrição, acceptance criteria.
Input descrição livre → avaliar clareza, ativar `deep-interview` se ambíguo.
**Sempre** localizar a fonte de contrato (`$API_CONTRACT_PATH`) antes de planejar contratos.

### 0.2 Análise paralela (3 frentes)

**Frente 1: Infra & viabilidade:** auth, HTTP client (`apiClient` em `lib/api`), estratégia de revalidação (`revalidatePath`/`router.refresh`), navegação/roteamento. (Os pontos concretos vêm de `nextjs-react19-architecture`.)

**Frente 2: Padrões existentes & baseline de qualidade:** analisar features de referência, catalogar leitura (RSC) e mutação (Server Actions), `lib/api`, composição de hooks de UI, e componentes reutilizáveis já existentes.

**Frente 3: Naming & contrato:** aplicar `naming-conventions` à árvore proposta; **ativar `api-contract`** para mapear cada endpoint necessário ao spec correspondente; propor árvore correta, sem barrels.

### 0.3 Checklist de viabilidade

- [ ] Mecanismo de auth entendido
- [ ] HTTP client claro
- [ ] Navegação/roteamento definido
- [ ] Estratégia de revalidação definida (`revalidatePath`/`router.refresh`)
- [ ] Endpoints do backend localizados no spec, todos os 200/4xx contemplados

**Gate**: aguardar aprovação antes da Phase 1.

## Fase 1: arquitetura antes do código

Produzir os entregáveis de arquitetura (ajuste os itens de UI/navegação ao seu módulo de stack):

1. **Árvore de feature completa**: diretórios + arquivos (sem barrels)
2. **Hierarquia de rotas (`src/app/**`)**: fluxo de navegação (sem `*.screen.tsx`)
3. **Lista de componentes**
4. **Mapa de estado**: estado de URL/local, params de navegação (sem query keys; servidor é fresco via RSC)
5. **Leitura & mutação**: leitura via RSC (`apiClient`), mutação via Server Action → `revalidatePath`/`router.refresh`; todo acesso a dado de servidor declarado
6. **Hooks com estado**: só os que precisam existir
7. **Helpers puros, constants, types**: `types/api.types.ts`, `domain.types.ts`, `ui.types.ts`
8. **Boundaries de loading/erro**: onde ficam suspense/skeleton e error boundary
9. **Plano de acessibilidade**: contraste/foco visível/teclado (ver `design-system`)
10. **Plano de testes**: comportamentos a testar (não implementação), localização

**Gate**: aguardar aprovação antes da Phase 2.

## Fase 2: implementação (ordem estrita)

0. **Reuse scan**: antes de criar helper/componente, varrer utils centrais, design system e features irmãs. Promove pro core o que for genérico.
1. **Types**: `types/api.types.ts` (espelho do spec), `domain.types.ts`, `ui.types.ts`
2. **Schemas**: `*.schema.ts` com valibot, tipo via `InferOutput` (vide `api-contract`)
3. **Constants**: valores estáticos (sem query keys)
4. **`lib/api`**: chamadas HTTP via `ky`/`apiClient` + validação na borda + JSDoc com `Endpoint:` e `Source:`
5. **RSC + Server Actions**: leitura no Server Component (`apiClient`); mutação na Server Action → `revalidatePath`/`router.refresh`
6. **Components**: componentes folha `'use client'` só para interatividade
7. **Rotas**: `src/app/**` compõem os componentes e definem boundaries de loading/erro (sem `*.screen.tsx`)
8. **Tests**: comportamento

## Fase 3: audit

1. [ ] Sem re-renders desnecessários (refs estáveis; o React Compiler memoiza sozinho, sem memo manual, `no-manual-memo` pega)
2. [ ] Listas/coleções renderizadas de forma performática
3. [ ] Sem efeito fazendo fetch/sync acoplado à UI
4. [ ] Acessibilidade (contraste/foco visível/teclado: ver `design-system`)
5. [ ] Sem cache proibido; mutação revalida via `revalidatePath`/`router.refresh`
6. [ ] JSDoc presente em todos exports
7. [ ] KISS/YAGNI/SOLID: sem over-engineering
8. [ ] Test coverage de comportamento

Issues encontrados → fix → re-audit até clean.

## Entrega

Antes de declarar pronto:

```bash
bun run verify && bun run build
```

- Árvore de feature casa com a canônica da stack
- Todo export tem JSDoc
- `layer-boundaries` respeitada
- Error handling via pipeline central
- Pronto pra `/pr-ready`

## Sinais de alerta: PARE

- Pulando Phase 0 "porque o requisito está claro"
- Criando arquivo antes de Phase 1 aprovada
- Inferindo shape de response em vez de ler o spec
- Criando barrel "por costume"
- Pondo data-fetching direto no componente

## Racionalizações comuns

| Desculpa                                                  | Realidade                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| "Requisito tá claro, não precisa Phase 0"                 | Phase 0 inclui mapear contrato, permissões, navegação. Não é só requisito.     |
| "Vou pular o reuse scan, sei que não tem nada parecido"   | "Sei" é palavra perigosa. Scan é grep, custa 30 segundos.                      |
| "Crio só um `index.ts` pequenininho na feature"           | Zero barrel é zero. Não existe "pequenininho".                                 |
| "Esse endpoint nem mudou recente, não precisa abrir spec" | O spec é a fonte. Mudou ou não, abre.                                          |
