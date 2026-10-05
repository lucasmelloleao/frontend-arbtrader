# Stack Sênior: boilerplate Next.js com arquitetura verificável

Base Next.js 16 + React 19 para construir SaaS com um caminho de arquitetura
claro e verificável. As regras importantes vivem em `oxlint`, TypeScript,
testes e hooks, enquanto o fluxo de desenvolvimento assistido por agentes fica
embutido no próprio repositório.

O pacote combina uma aplicação de referência, documentação de decisões, gates de
qualidade e integrações opcionais. O resultado é uma base previsível, auditável e
fácil de adaptar ao seu produto.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + React Compiler |
| Linguagem | TypeScript 7 nativo (`tsc` em Go) |
| Runtime/PM | Bun ponta a ponta (dev/build/start/test) |
| Estilo | Tailwind CSS v4 |
| Validação | valibot (confinada às bordas, em `*.schema.ts`) |
| HTTP | ky (confinado a `lib/api`) |
| Lint | oxlint 1.77 **type-aware** (built-in + plugin custom `boilerplate/*`) |
| Format | oxfmt |
| Dead code | knip |
| Hooks de git | lefthook |

## Arquitetura (imposta, DAG)

```
app → features → lib → shared → (externo)
```

- **RSC-puro, sempre fresco**: leitura = Server Component; mutação = Server Action → `revalidatePath`. Sem SWR/React Query, sem cache (`'use cache'`/`revalidate>0` proibidos; `React.cache()` permitido). `cacheComponents` está ligado, mas é *streaming*, não cache: o shell estático sai no primeiro byte e o dado chega sob `<Suspense>`, fresco a cada request.
- **Bordas**: valibot só em `*.schema.ts`; ky só em `lib/api`; todo backend via `apiClient` (impossível buscar sem validar).
- **Auth**: cookie JWT same-site emitido pelo backend; `src/proxy.ts` (Next 16) roteia por presença do cookie; o `kyServer` encaminha o cookie ao backend. O front nunca decodifica/valida JWT.
- **Sem barrel**, sem `any`/`as`/`!`/`assert`, sem `node` como runtime, **sem supressão de lint**.

Tudo acima é **imposto** por `oxlint` (incl. o plugin custom em
`tooling/oxlint-rules/`) + typecheck + Knip + pre-commit/pre-push (lefthook) +
CI. Detalhes: **`ARCHITECTURE.md`**, **`CODE-PATTERN.md`**,
**`VERCEL-OXLINT-MAPPING.md`** e **`.claude/docs/guardrails-catalog.md`**;
decisões e porquês ficam em **`MEMORY.md`**.

## O que já vem escrito

A camada de referência é código real, não esqueleto — as regras apontam para arquivos que existem:

```
src/proxy.ts                    gate de roteamento (Next 16; raiz de src, irmão de app/)
src/lib/api/client.ts           apiClient: gateway único, valida via Standard Schema
src/lib/api/ky.server.ts        RSC/Server Action; encaminha o cookie ao backend
src/lib/api/ky.client.ts        browser-direct (login); é onde o Set-Cookie pousa
src/lib/env.schema.ts + env.ts  env validada com valibot + server-only, falha fechado
src/features/auth/              login: schema, hook, form
src/features/perfil/            leitura + mutação de exemplo: schema, Server Action, hook, form
src/app/perfil/page.tsx         leitura RSC sob <Suspense> (Partial Prerender)
test/fetch-mock.ts              mock de IO na borda
```

## Começando

```bash
bun install
bun run dev          # http://localhost:3000
```

Copie `.env.example` para `.env.local` e aponte `NEXT_PUBLIC_API_URL` / `INTERNAL_API_URL` para o seu backend REST.

```bash
bun run verify               # GATE CANÔNICO (pré-push e CI)
bun run verify:fast          # subconjunto rápido do loop
bun run lint / fmt / knip    # peças individuais
bun run typecheck            # next typegen && tsc (app + testes)
bun test                     # testes Bun
bun run build                # typegen + tsc + next build
```

`bun run verify` = lint type-aware + oxfmt + typecheck (app/testes/tooling) + knip + testes + guard de supressão de lint + budget de peso dos assets. É o único gate que importa antes de concluir.

## Desenvolvimento assistido, multi-host

Skills, comandos e hooks dão contexto ao fluxo de desenvolvimento e permanecem
**alinhados aos padrões impostos** acima. Os hooks são compartilhados entre
hosts: os scripts vivem em `tooling/agent-hooks/` e cada host só aponta para
eles — `.claude/settings.json`, `.codex/hooks.json` e
`.cursor/hooks.json`. A `pre-review` compartilhada fica em
`.agents/skills/`; os registros específicos do Claude ficam em
`.claude/skills/`.

- **Skills**: arquitetura (`nextjs-react19-architecture`), boundaries
  (`layer-boundaries`), formulários (`forms`), qualidade
  (`typescript-strict`, `feature-audit`, `pr-ready`,
  `pre-review`, `orquestrar`), workflows e performance.
- **Comandos**: `/new-feature`, `/expand`, `/refactor`, `/review`, `/orquestrar`, `/pr-ready`, `/pre-review`, `/create-pr`, `/audit`, etc.
- **Hooks**: `SessionStart` injeta as regras; `UserPromptSubmit` reforça a cada turno; `PostToolUse` formata com oxfmt e relembra o que o lint não pega; `PreToolUse` bloqueia comando destrutivo, commit/push em branch protegida e abertura de PR sem pré-review; `Stop` impede concluir com o gate vermelho.

Fluxo até o PR: **`/pr-ready`** (gate mecânico) → **`/pre-review`** (julgamento por subagentes; grava o selo por HEAD) → **`/create-pr`**. Sem o selo, a abertura do PR fica bloqueada pelo hook.

Para demandas maiores, **`/orquestrar`** coordena o trabalho no Orca: decide se cabe em uma PR,
divide em até três fatias coerentes, despacha workers em worktrees e conduz review independente
antes de liberar cada PR. O workflow é genérico; a integração com Jira, modelos e nomes de branch
fica para o projeto que adaptar a base.

Ferramentas de terceiros (opcionais, ensinadas em `integracoes/`): **GitNexus**
(grafo do código), **impeccable** (qualidade de UI a partir de `DESIGN.md`) e
**CodeRabbit** (review de PR).

## Guia

O manual completo está em **`guia/guia.pdf`**. Ele cobre instalação,
personalização, arquitetura, dados, guardrails, gates, hooks, integrações,
decisões e troubleshooting. Para editar ou recompilar, consulte
`guia/README.md`.
