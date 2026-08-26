# Arquitetura: boilerplate

Documento canônico (lido por humanos **e** agentes). O `SessionStart` inject é um
resumo curto que aponta pra cá; as regras estão **impostas** por oxlint/typecheck
(ver `CODE-PATTERN.md` e `VERCEL-OXLINT-MAPPING.md`). Decisões e o porquê: `MEMORY.md`.

## Visão geral

`boilerplate` é o **frontend / BFF** (Next.js 16 App Router + React 19). Ele **não**
tem banco nem regra de negócio: consome o **backend REST separado** `api-server`.
Também serve como base para fluxos de desenvolvimento assistido por agentes; por
isso, a arquitetura e os padrões verificáveis são **impostos por lint**, não só
documentados.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.3.0 (App Router, Turbopack) |
| UI | React 19.2.8 + React Compiler |
| Linguagem | TypeScript 7 nativo (`tsc` 7.0.2) + `@typescript/native-preview` (ponte do Next) |
| Runtime/PM | Bun ponta a ponta (dev/build/start/test) |
| Estilo | Tailwind CSS v4 |
| Lint | oxlint 1.77 (built-in + plugin custom `boilerplate`) |
| Deploy | Dokploy (self-host Docker): fase futura |

## Topologia & rede

```
Browser ──> app.example.com   (este repo: Next/RSC/Server Actions)
                │  cookie JWT same-site (.example.com)
                └─> api.example.com  (api-server: REST + JWT)
```

Front e backend compartilham o mesmo eTLD+1 → cookie **first-party** `SameSite=Lax`.
Dev: `.example.com`. Sem necessidade de BFF dedicado nem CSRF token.

## Camadas (direção única, DAG)

```
app → features → lib → shared → (externo)
```

| Camada | Pode importar | Papel |
|--------|---------------|-------|
| `app/` | tudo | Rotas, layouts, composição |
| `features/<dom>/` | shared, lib, a própria feature | Slices de domínio. **Não** importa sibling feature |
| `lib/` | shared, externo | Infra: `api/` (ky+apiClient), `auth/`, `env`, `proxy` |
| `shared/` | só externo | Folha pura: `ui/`, `utils/`, `schemas/`, `types/` |

- `shared` é **folha**: não importa nada interno.
- O que é compartilhado entre features **sobe para `shared`**: feature nunca importa feature.
- **Sem barrel** (`index.*` de re-export).
- Imposto por: `boilerplate/enforce-boundaries`, `boilerplate/no-index-barrel`, `import/no-relative-parent-imports`.

## Estrutura de pastas

O que já vem escrito está marcado com ✅ — a camada de referência é código real, não
esqueleto vazio: as regras de lint apontam para arquivos que existem.

```
src/
  proxy.ts              ✅ gate de roteamento (Next 16; substitui middleware.ts).
                           Mora na RAIZ de src, irmão de app/ — não dentro de app/.
  app/                  # rotas (RSC por padrão), layouts, error/not-found
    login/page.tsx      ✅ login browser-direct (o backend emite o cookie)
    perfil/page.tsx     ✅ leitura RSC sob <Suspense> (shell estático + streaming)
  features/<dom>/       # *.schema.ts (validação), componentes, hooks, server actions
    auth/               ✅ login.schema.ts, use-login-form.ts, login-form.tsx
    perfil/             ✅ schema, actions (Server Action), hook e form
  lib/
    api/                ✅ ky.server.ts, ky.client.ts, base-url.ts, endpoints.ts,
                           client.ts (apiClient): único acesso ao backend
    env.schema.ts       ✅ schema valibot da env de servidor
    env.ts              ✅ env validada, com server-only
  shared/{ui,utils,schemas,types}/   # folha pura; vazia até o 1º primitivo cross-feature
test/                   ✅ mocks de IO na borda (fetch-mock)
tooling/oxlint-rules/   ✅ plugin custom de lint (NÃO é app code)
tooling/agent-hooks/    ✅ hooks de agente compartilhados (Claude Code · Codex · Cursor)
```

Não há `lib/auth/`: a auth deste desenho não tem estado no front. O `proxy.ts` checa
a presença do cookie para rotear, e o `kyServer` encaminha o cookie ao backend — quem
valida sessão e autorização é sempre o backend. Um módulo de auth no front seria
justamente a camada que o ADR-007 proíbe.

## Fluxo de dados: RSC-puro, sempre fresco

- **Leitura** = Server Component, buscando no backend no servidor, com `<Suspense>`/`loading.tsx` (streaming). Fetches paralelos (`Promise.all`).
- **Sem cache**: proibido `'use cache'`, `unstable_cache`, `cache:'force-cache'`, `revalidate=false|>0`, `dynamic:'force-static'`. `React.cache()` (dedup por request) é permitido.
- **Sem lib de data-fetching no client** (sem SWR/React Query). Interatividade = React 19 (`useActionState`, `useOptimistic`).
- **Mutação de dado** = Server Action → `revalidatePath`/`router.refresh` pra repuxar fresco.
- Imposto por: `boilerplate/no-use-cache`, `boilerplate/no-force-static`, `boilerplate/no-fetch-in-effect`, `no-await-in-loop`.

## Autenticação

- Cookie **JWT same-site** emitido pelo backend: `session_token` (access, httpOnly) e `refresh_token` (httpOnly, só com `rememberMe`). Cookies **públicos** não-httpOnly (`user_role`, `authorities`, …) só pra **dica de UI**.
- RSC e Server Actions leem o cookie via `next/headers` e o **encaminham** ao backend.
- **Refresh proativo de token** vai no **`proxy.ts`** (Next 16: não `middleware.ts`), relayando o `Set-Cookie` do backend.
- **Authz é sempre no backend.** O front **nunca** decodifica/valida/assina JWT; cookies públicos não são fonte de autorização.
- Imposto por: `no-restricted-imports` (jose/jsonwebtoken banidos), `no-restricted-properties` (`document.cookie`), guardrail `proxy.ts`.

## Bordas

- **valibot** só em `*.schema.ts` (validação confinada às bordas; nunca confiar na resposta crua do backend).
- **ky** só em `lib/api`; todo acesso ao backend via `apiClient`.
- `server-only` / `client-only` marcam as bordas server↔client.

## Runtime & toolchain

- **Bun ponta a ponta**; `node` é proibido como runtime nosso (guardrail). Em produção (Dokploy) o container roda Bun: ponto de risco registrado (ver `MEMORY.md`).
- **TS7 nativo**: `tsc` (7.0.2) faz o type-check; o Next detecta `@typescript/native-preview` e usa o TypeScript CLI no build. `next typegen` roda **antes** do `tsc` (rotas tipadas).

## Enforcement (os portões)

| Camada | Mecanismo |
|--------|-----------|
| Tipos | TS7 + `Validator<T>` estrutural (validação obrigatória por construção) |
| Lint | oxlint: built-in + overrides por zona + plugin custom `boilerplate` |
| Pre-commit | lefthook (oxlint + typecheck + test) |
| CI | GitHub Actions: grep-gates + oxlint + test + typecheck + build |
| Loop do agente | Stop hook (typecheck + lint) + SessionStart inject |

## Branches

Modelo de branch é **escolha do time**: o boilerplate não impõe um fluxo. Default: **trunk-based em `main`** (feature → PR → `main`), assumido pelas skills `pr-ready`/`pr-creation`. Quem usa gitflow (`develop`/`staging`/`release`) ou outro fluxo ajusta a branch base nessas duas skills.

## Fora de escopo (fases futuras)

Código de aplicação (env/api/auth/`proxy.ts`, scaffold), deploy (Dockerfile Bun +
Dokploy + healthcheck), E2E (Playwright), e o checklist de fase-de-build (CSP com
nonce, `experimental.taint`, `error.tsx`/`global-error.tsx`/`not-found.tsx`,
`next/image` `preload`, rate limiting).
