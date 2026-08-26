---
name: workflow-refactor
description: "Use quando o usuário digitar 'refactor', 'refatorar', 'reorganizar', 'cleanup', 'technical debt', 'dívida técnica', ou passar um path de feature / issue com intenção de reestruturar. Sintomas: feature com data-fetching acoplado à UI, types.ts monolítico, componentes flat sem organização, loading manual, dead code, imports via barrel."
---

# Workflow: Refactor

## Visão geral

Refactor de código existente. Não greenfield, não expansão. A fonte da verdade NÃO é o código atual: é o contrato do backend (`api-contract`), os princípios (`layer-boundaries`, `no-barrel-policy`) e o que o usuário confirma como regra de negócio. O que estava errado, sai. Sem fallback de compatibilidade pra antipattern.

**Referência cruzada (núcleo):** `layer-boundaries`, `api-contract`, `no-barrel-policy`, `naming-conventions`, `core-principles`, `typescript-strict`, `deep-interview`.
**Específico da stack:** `nextjs-react19-architecture` define a árvore canônica alvo (`features/<dom>/` com `*.schema.ts`, componentes, server actions; rotas em `src/app/**`, sem `*.screen.tsx`) e os padrões de UI/data-fetching (leitura = RSC, mutação = Server Action). Performance (RSC/waterfall/bundle): `vercel-react-best-practices`.
**Opcional (terceiros):** se você usa GitNexus, faça o pré-voo de blast radius (ver `integracoes/gitnexus.md`).

## Quando usar

- Reorganizar feature existente (split types, components flat → sub-folders, hooks dispersos)
- Migrar data-fetching acoplado (efeito de fetch na UI) → RSC + Server Action
- Substituir barrels (`index.ts` de reexport) por imports diretos
- Remover dead code identificado
- Alinhar schemas/types com o contrato do backend após drift detectado

## Quando NÃO usar

- Greenfield → `workflow-new-feature`
- Adicionar aba/seção em feature existente → `workflow-feature-expansion`
- Hotfix de bug pontual → corrigir direto, sem workflow

## Princípio central: Código atual NÃO é fonte da verdade

Em refactor, o código atual existe **justamente porque** carrega decisões que não devem persistir.

- **NUNCA** infira "intenção" do código atual para preservar "como está".
- **NUNCA** crie fallback ou modo de compatibilidade pra padrão identificado como antipattern na Fase 0.
- **SEMPRE** pergunte ao usuário quando há ambiguidade sobre regra de negócio. Refactor é o momento de mudar a forma: confirmar é mais barato que perpetuar bug.
- Decisões de produto/UX no código antigo só ficam se o usuário **confirmar explicitamente**.

## Restrições (não-negociáveis)

- Não é dirigido por número de linhas: é dirigido por **boundary de responsabilidade** (vide `layer-boundaries`).
- Estratégia de teste é parte do entregável (unitário + integração quando aplicável).
- Tests faltantes viram débito explícito documentado, não invisíveis.
- Dead code removido no mesmo diff. Sem "limpa depois".
- Camadas e zero-barrel são **impostas por lint** (`bun run lint` + `layer-boundaries`/`no-barrel-policy`): aqui a ação é **migrar** o que viola, não só apontar.
- `api-contract` ativada antes de tocar qualquer schema/types/chamada de API.
- Error handling centralizado e humanizado (pipeline central). Sem `error.message` cru.

## Fase 0: gate de infraestrutura

### 0.1 Descoberta

- Input é issue → buscar acceptance criteria.
- Input é path → mapear a feature.
- Ambíguo → ativar `deep-interview` antes de prosseguir.
- **Sempre** localizar a fonte de contrato (`$API_CONTRACT_PATH`) antes de qualquer análise contratual (vide `api-contract` Regra 1).

### 0.2 (Opcional) Pre-flight: blast radius

Se o projeto usa **GitNexus** (ver `integracoes/gitnexus.md`): para cada símbolo público da feature
no escopo (hooks exportados, schemas, e artefatos legados a migrar: `services`/funções de tela), rode `impact` (direction upstream)
e `detect_changes`. Documente `risk`, callers diretos e processos afetados. Símbolo com risco
CRITICAL → gate de aprovação explícito do usuário antes de tocar.

Sem GitNexus: mapeie manualmente os call-sites (grep dos símbolos exportados) e registre o risco;
NÃO infira o blast radius sem evidência.

### 0.3 Análise paralela (3 frentes)

**Frente 1: Infra audit:** padrões de auth, uso de HTTP client (`apiClient` em `lib/api`), storage, navegação/roteamento, adoção de RSC + Server Actions.

**Frente 2: Qualidade & padrões:** antipadrões (fetch acoplado à UI, React Query/SWR, `*.screen.tsx`, loading manual, constantes/sub-componentes inline), dead code (imports/exports não usados), gaps de cobertura.

**Frente 3: Naming & contrato:** compliance com `naming-conventions`; organização de types (`types.ts` monolítico vs pasta `types/`); organização de components; alinhamento types/schemas com o spec (`api-contract`); barrels presentes (`no-barrel-policy`).

### 0.4 Gate de aprovação

Apresentar inventário (incluindo blast radius, se houver) + perguntar ao usuário sobre ambiguidades de negócio. **Aguardar aprovação** antes da Fase 1. Símbolos CRITICAL exigem confirmação explícita ("sim, pode tocar").

## Fase 1: mapeamento & diagnóstico

Produzir:

1. **Inventário de antipadrões**: toda violação com `file:line`.
2. **Lista de dead code**: exports/imports/funções não usados.
3. **Lista de boundary errada**: responsabilidades no lugar errado (vide `layer-boundaries`).
4. **Mapa de dependências**: quem importa o quê, ciclos.
5. **Risk assessment**: o que pode quebrar.
6. **Drift report** (se aplicável): divergência spec × código.

## Fase 2: plano de refactor

Produzir:

1. **Target feature tree**: estrutura canônica (`nextjs-react19-architecture`): `features/<dom>/` com `*.schema.ts`, componentes, server actions; rotas em `src/app/**`.
2. **File moves/renames**: From → To.
3. **Types reorg**: como `types.ts` quebra em `types/api.types.ts` + `domain.types.ts` + `ui.types.ts`.
4. **Components reorg**: como organizar a UI.
5. **Data plan**: leitura → RSC (`apiClient`); mutação → Server Action → `revalidatePath`/`router.refresh`; hooks de UI só para interatividade.
6. **`lib/api` plan**: valibot (`*.schema.ts`), JSDoc, alinhamento contratual.
7. **Barrel removal**: quais barrels saem, quais callers ajustam.
8. **Tests plan**: coverage gap fix.
9. **Ordem de migração**: types → schemas (valibot) → `lib/api` → RSC/Server Actions → components → rotas (`src/app/**`) → tests → dead code removal.

**Gate**: aprovação do usuário antes da Fase 3.

## Fase 3: implementação

Executar exatamente na ordem do plano. Cada etapa concluída → commit pequeno e nomeado.

Pontos de re-ativação obrigatória de skills:

- Antes de tocar schema/types/chamada de API → re-confirmar `api-contract`.
- Antes de cada novo arquivo → `naming-conventions` + `layer-boundaries`.
- Ao remover barrel → `no-barrel-policy`.

## Fase 4: verificação

Antes de declarar refactor pronto (ajuste os comandos à sua stack):

```bash
bun run verify && bun run build
```

Todo anti-pattern listado na Fase 1 → resolvido (sem fallback).
Feature tree casa com a canônica.
Tests faltantes declarados como débito no PR description.

Pronto pra `/pr-ready` (gate antes do PR).

## Referência rápida

| Sintoma encontrado                            | Ação no refactor                                          |
| --------------------------------------------- | --------------------------------------------------------- |
| Efeito que faz fetch acoplado à UI            | Leitura → RSC (`apiClient`); mutação → Server Action      |
| React Query/SWR ou cache no client            | Remover; servidor fresco via RSC, revalidar via `revalidatePath`/`router.refresh` |
| `*.screen.tsx` (tela fora de rota)            | Mover conteúdo para a rota em `src/app/**`                |
| Loading/error state manual                    | Eliminar, usar Suspense/streaming no RSC                  |
| Barrel (`index.ts`) em feature                | Deletar, ajustar todos os callers para path completo      |
| Component declarado dentro de outro component | Extrair para arquivo próprio                              |
| `try { ... } catch { showToast('Erro') }`     | Propagar, hook decide, mensagem em constante              |

## Sinais de alerta: PARE

- Vontade de "preservar o jeito antigo por compatibilidade"
- "Vou refatorar X agora, Y depois" → escopo do refactor já foi acordado, não vaza
- Achar que código atual mostra "a intenção": não, mostra a dívida
- Pular `api-contract` "porque é só refactor de componente": se tocou tipo/schema/contrato, ativa

## Racionalizações comuns

| Desculpa                                      | Realidade                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Não vou mexer no schema porque já existia"   | Refactor é o momento. Se o schema diverge do spec, agora é a hora.                   |
| "Mantém o barrel pra não quebrar callers"     | Callers ajustam junto. Vide `no-barrel-policy`.                                      |
| "Esse efeito de fetch funciona, deixa"        | Funciona até a tela ficar mais complexa. Migra agora.                                |
| "Test pode ficar pra depois"                  | Sem teste, próximo refactor recomeça do zero. Documenta como débito explícito no PR. |
