<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

Guia comum para Codex, Claude Code e Cursor. O `CLAUDE.md` organiza a
constituição; os documentos canônicos explicam a arquitetura, os padrões, os
gates e as decisões. Em conflito, esta ordem vence: contrato externo confirmado,
`AGENTS.md`, `CLAUDE.md`, documentos canônicos e, por último, a convenção local.

Fontes de referência:

- `ARCHITECTURE.md`: camadas, dados, auth e limites.
- `CODE-PATTERN.md`: padrões obrigatórios de implementação.
- `VERCEL-OXLINT-MAPPING.md`: performance e enforcement.
- `.claude/docs/guardrails-catalog.md`: julgamento da pré-review.
- `MEMORY.md`: decisões e trade-offs, em formato append-only.
- `.agents/skills/orquestrar/SKILL.md`: coordenação genérica no Orca.

## Estrutura (camadas, DAG `app → features → lib → shared`)

- `src/proxy.ts`: gate de roteamento do Next 16 (substitui `middleware.ts`). Mora na **raiz de `src`**, irmão de `app/` — **não** dentro de `app/`.
- `src/app/`: rotas (RSC por padrão), layouts, `error`/`not-found`.
- `src/features/<domínio>/`: slices de domínio (`*.schema.ts`, componentes, hooks, server actions). Não importa sibling feature.
- `src/lib/`: infra: `api/` (ky + `apiClient`), `env.schema.ts` + `env.ts`.
- `src/shared/{ui,utils,schemas,types}/`: folha pura (não importa nada interno).
- `test/`: mocks de IO na borda. `tooling/`: regras de lint e hooks de agente (não é app code).

## Comandos

- `bun run dev`: dev server.
- **`bun run verify`: o gate canônico.** Lint type-aware + oxfmt + typecheck (app/testes/tooling) + knip + testes + guard de supressão + budget de assets. É o que roda no pré-push e no CI.
- `bun run verify:fast`: subconjunto rápido pro loop (sem typecheck). É o que o hook de `Stop` roda.
- `bun run lint` / `bun run lint:fix`: oxlint com `--type-aware` (built-in + `boilerplate/*`).
- `bun run fmt` / `bun run fmt:check`: oxfmt.
- `bun run knip`: código e dependência mortos.
- `bun run typecheck` / `bun run typecheck:tooling`: tsc do app + testes / das regras custom.
- `bun test`: testes Bun.
- `bun run build`: typegen + tsc + next build.

## Runtime e ferramentas

- Bun para scripts e gerenciamento de pacote. Não introduza outro runtime, package manager ou runner de TypeScript.
- TypeScript 7 **é** o `tsc` nativo (porte em Go). O `@typescript/native-preview` fornece o `tsgo`, o canal preview do mesmo compilador. Os dois convivem de propósito — não volte para o TypeScript 5/6.
- `node:` dentro de tooling/hooks rodados pelo Bun é permitido: são as implementações do Bun para esses módulos padrão.
- Nunca suprima lint por comentário/diretiva nem desative/exclua regra para passar
  o gate. Corrija a causa. `tooling/no-lint-suppression.ts` reprova o `verify`.

## Estilo & naming

- TypeScript estrito; sem `any`/`as`/`!`/`assert` (ver skill `typescript-strict`).
- Componentes `PascalCase`; arquivos `kebab-case`; hooks `use*`; schemas `*.schema.ts` (ver `naming-conventions`).
- Componentes puros; sem side-effects no render; sem barrels (ver `no-barrel-policy`).
- Validação com **valibot** confinada a `*.schema.ts`; HTTP com **ky** confinado a `lib/api`.

## Extração e abstração

- Um caller fica inline. Extração local comum começa no **2º caller real**. Abstração genérica reutilizável (framework, provider, factory, hook genérico) exige **3 usos concretos**.
- Primitivo concreto cross-feature (calendar, `DateRangePicker`, formatters) pode ir para `shared` no 1º write — isso é colocação, não abstração especulativa.
- Normalizer só na borda externa (HTTP/form). Nada de re-parse defensivo de URL que o próprio app emitiu; id de catálogo via registry const, nunca literal solto em `if`/`===`.
- Estado impossível (o tipo, o schema ou o control flow já garantiu) se confia: sem `?? ''`, `|| []`, `?? 0`, branch cerimonial, `assert` ou `!`.
- Erro do backend não vira workaround no front. Reporte, pergunte, e recomende corrigir o backend.

## Testes

- Orientados a comportamento; mock de IO na borda de `lib/api` (ver `test/fetch-mock.ts`).
- Nomes `*.test.ts(x)` em kebab-case, próximos da unidade (`__tests__/` ao lado do código).

## Documentação e interface

- Texto visível deve ser PT-BR natural, direto e sem jargão desnecessário.
- UI usa tokens do `DESIGN.md`; preserve foco visível, contraste AA e
  `prefers-reduced-motion`.
- Atualize `guia/` quando uma mudança alterar instalação, guardrail, comando ou
  decisão que o comprador precisa conhecer.

## Commits & PRs

- Conventional Commits (`feat:`, `fix:`, `chore:`…). Curtos e escopados, divididos por domínio coeso.
- Nunca commite nem pushe direto na `main` — o hook `guard-shell` bloqueia. Feature entra via PR com base na `main`.
- Antes de `gh pr create`: `/pr-ready` (gate mecânico) → `/pre-review` (julgamento; grava o selo que libera o gate) → `/create-pr`.
- Para trabalho com múltiplas fatias ou agentes: `/orquestrar` coordena worktrees, workers e review independente antes dessa cadeia.
- PRs: propósito, issues ligadas, regras de negócio assumidas, decisões/trade-offs, screenshots de UI e test plan. `bun run verify` verde.
