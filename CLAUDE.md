# CLAUDE.md

Constituição deste boilerplate. Curto e verdadeiro: regra que mente é pior que
ausente. Os documentos canônicos são lidos por pessoas e ferramentas, e as
regras verificáveis são impostas por lint, typecheck, testes e hooks:

- **`ARCHITECTURE.md`**: visão geral, camadas, fluxo de dados, auth.
- **`CODE-PATTERN.md`**: padrões de código (regras, não opções).
- **`VERCEL-OXLINT-MAPPING.md`**: mapeamento regra ↔ lint.
- **`MEMORY.md`**: decisões (ADRs) e o porquê.
- **`.claude/docs/guardrails-catalog.md`**: catálogo único do julgamento da pré-review.
- **`.agents/skills/orquestrar/SKILL.md`**: workflow compartilhado para coordenação no Orca.

> ⚠️ Esta é uma versão nova do Next.js: leia o `AGENTS.md` antes de escrever código.

@AGENTS.md

## Comandos

```bash
bun run dev                  # dev server (Turbopack)
bun run verify               # GATE CANÔNICO: lint + fmt + typecheck + knip + test + guards
bun run verify:fast          # subconjunto rápido do loop (sem typecheck)
bun run lint / lint:fix      # oxlint --type-aware (built-in + boilerplate/*)
bun run fmt / fmt:check      # oxfmt
bun run knip                 # código e dependência mortos
bun run typecheck            # next typegen && tsc (app + testes)
bun run typecheck:tooling    # tsc das regras custom de lint
bun test                     # testes Bun
bun run build                # typegen + tsc + next build
```

O `verify` é o que roda no pré-push e no CI. É o único gate que importa antes de concluir.

## Branch base (PRs)

`main` (default trunk-based). **Edite esta linha** se o time usa outro fluxo (ex.: `develop`/gitflow). As skills `pr-ready`/`pre-review`/`pr-creation` e os hooks `guard-shell`/`pre-pr-review-gate` leem daqui; se estiver no default e ainda não confirmado, o agente pergunta **uma vez** antes de abrir PR e grava a escolha aqui: depois não pergunta mais.

## Stack

Next.js 16 (App Router) · React 19 + Compiler · TypeScript 7 nativo · Bun ponta a ponta · Tailwind v4
· **valibot** (bordas, `*.schema.ts`) · **ky** (`lib/api`) · oxlint + plugin custom `boilerplate/*`.

## Arquitetura

`app → features → lib → shared` (DAG, direção única). Detalhe e enforcement em `ARCHITECTURE.md`.
Camadas: skill `layer-boundaries`. Naming: `naming-conventions`. Sem barrel: `no-barrel-policy`.

A camada de referência **vem escrita**: `lib/api` (`apiClient`/`kyServer`/`kyClient`), `lib/env`,
`src/proxy.ts` e as features de exemplo `auth` e `perfil` — as regras apontam para código real.
`src/proxy.ts` mora na **raiz de `src`**, irmão de `app/` (Next 16), não dentro de `app/`.

## Dados & bordas

RSC-puro, sempre fresco: **sem** React Query/SWR, **sem** cache (`'use cache'`/`revalidate>0`
proibidos; `React.cache()` permitido). `cacheComponents` está ligado, mas é **streaming, não cache**:
a subárvore que lê dado fica sob `<Suspense>` e cada request busca fresco (ADR-025).
Leitura = Server Component via `apiClient`; mutação = Server
Action → `revalidatePath`/`router.refresh`. valibot só em `*.schema.ts`; ky só em `lib/api`. Ver
`CODE-PATTERN.md` + skills `api-contract` / `forms`.

## Contrato de API

O backend é a fonte da verdade. Antes de tocar schema/types, ative `api-contract` e espelhe o spec
(OpenAPI) 1:1. Defina `$API_CONTRACT_PATH` apontando para a fonte do contrato.

<!-- Cole aqui o bloco de integração do GitNexus, se usar: ver integracoes/gitnexus.md -->

## Documentação do projeto

- **`PRODUCT.md`**: produto, usuários, brand personality.
- **`DESIGN.md`**: sistema visual normativo (tokens). Design via `impeccable` (ver `integracoes/impeccable.md`).
- **`knowledge.md`**: base de conhecimento do código (gere/atualize via varredura: ver `knowledge.template.md`).
- **`guia/guia.pdf`**: manual de início e referência, gerado a partir de `guia/*.tex`.

## Multi-host

Os hooks de desenvolvimento assistido são compartilhados: `tooling/agent-hooks/*.ts`
(TypeScript, rodados pelo Bun), com uma configuração fina por host —
`.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`. A
`pre-review` fica em `.agents/skills/`; os registros específicos do Claude ficam
em `.claude/skills/`. Guardrail não é privilégio de um editor.

## Inegociáveis

- KISS / YAGNI (ver `core-principles`).
- Sem `any`/`as`/`!`/`assert`; validação na borda com valibot; `console` só `warn`/`error`.
- **Nunca suprimir lint** por diretiva pra passar o gate: corrija a causa (`tooling/no-lint-suppression.ts` reprova o `verify`).
- Um caller fica inline; extração no 2º caller real; abstração genérica exige 3 usos (`CODE-PATTERN.md` §9).
- Em dúvida sobre regra de negócio, **não assuma**: pergunte (ver `deep-interview`).
