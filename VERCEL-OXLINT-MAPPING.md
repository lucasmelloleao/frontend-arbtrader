# Vercel React Best Practices → oxlint

Mapeamento entre a skill **`vercel-react-best-practices`** (Vercel Engineering, 70 regras
em 8 categorias) e as regras estáticas configuradas no `.oxlintrc.json`.

Tudo que é estaticamente verificável virou regra `error`. O resto é **arquitetural**
(runtime/estrutura de dados/fluxo de I/O) e um linter não consegue provar: fica como
guia para revisão de código e geração, não como regra.

## Regras aplicadas (oxlint = `error`)

| # | Categoria (skill) | Regra(s) da skill | Regra oxlint |
|---|-------------------|-------------------|--------------|
| 1 | Eliminating Waterfalls | `async-parallel`, `async-defer-await` | `no-await-in-loop` |
| 1 | Eliminating Waterfalls | `async-parallel` (await dentro de `Promise.all`) | `unicorn/no-await-in-promise-methods`, `unicorn/no-single-promise-in-promise-methods` |
| 1 | Eliminating Waterfalls | uso correto de promises | `promise/no-nesting`, `promise/no-return-wrap`, `promise/no-multiple-resolved`, `promise/no-new-statics`, `promise/param-names`, `promise/valid-params`, `promise/prefer-await-to-then`, `unicorn/prefer-top-level-await` |
| 2 | Bundle Size | `bundle-barrel-imports` | `oxc/no-barrel-file`, `import/no-namespace` |
| 2 | Bundle Size | `bundle-analyzable-paths` | `import/no-cycle`, `import/no-dynamic-require`, `import/no-webpack-loader-syntax`, `import/no-self-import`, `import/no-duplicates` |
| 3 | Server-Side | baseline production do Next | plugin `nextjs/*` inteiro (21 regras) |
| 3 | Server-Side | `no-img-element` → LCP | `nextjs/no-img-element` |
| 3 | Server-Side | spread acumulado O(n²) em RSC/loops | `oxc/no-accumulating-spread`, `oxc/no-map-spread` |
| 4 | Client-Side | `client-event-listeners` | `unicorn/prefer-add-event-listener` |
| 5 | Re-render | `rerender-no-inline-components` | `react/no-unstable-nested-components` |
| 5 | Re-render | `rerender-memo` (props estáveis) | — (plugin `react-perf` removido: o React Compiler estabiliza props sozinho; ver ADR-026) |
| 5 | Re-render | identidade do `value` de Context | `react/jsx-no-constructed-context-values` |
| 5 | Re-render | deps corretas / regras de hooks | `react/exhaustive-deps`, `react/rules-of-hooks` |
| 5 | Re-render | keys estáveis | `react/jsx-key`, `react/no-array-index-key` |
| 5 | Re-render | React Compiler (projeto usa; memo manual proibido) | `react/react-compiler`, `boilerplate/no-manual-memo` |
| 6 | Rendering | `rendering-script-defer-async` | `nextjs/no-sync-scripts` |
| 6 | Rendering | segurança/correção de render | `react/no-danger`, `react/void-dom-elements-no-children`, `react/no-children-prop`, `react/self-closing-comp`, `react/jsx-no-target-blank`, `react/no-unknown-property` |
| 7 | JavaScript Perf | `js-min-max-loop` | `oxc/bad-min-max-func` |
| 7 | JavaScript Perf | `js-set-map-lookups`, `js-early-exit`, `js-flatmap-filter` | `unicorn/prefer-set-has`, `unicorn/prefer-includes`, `unicorn/prefer-array-find`, `unicorn/prefer-array-some`, `unicorn/prefer-array-flat-map` |
| 7 | JavaScript Perf | correção/perf geral | `oxc/only-used-in-recursion`, `oxc/uninvoked-array-callback`, `oxc/bad-array-method-on-arguments`, `unicorn/prefer-node-protocol` |

Reforço extra de production-grade (fora da skill): `typescript/no-explicit-any`,
`typescript/consistent-type-imports`, `typescript/no-import-type-side-effects`,
`typescript/ban-ts-comment`, `typescript/no-non-null-assertion`, `no-console`,
`no-debugger`, além das categorias `correctness`, `perf` e `suspicious` inteiras como erro.

## Regras arquiteturais (SEM equivalente de linter)

Estas continuam valendo, mas precisam de revisão humana / geração consciente: nenhum
linter consegue prová-las estaticamente:

- **Waterfalls**: `async-cheap-condition-before-await`, `async-dependencies` (better-all),
  `async-api-routes` (iniciar promise cedo / await tarde), `async-suspense-boundaries`.
- **Bundle**: `bundle-dynamic-imports` (`next/dynamic`), `bundle-defer-third-party`,
  `bundle-conditional`, `bundle-preload`.
- **Server**: `server-auth-actions`, `server-cache-react` (`React.cache()`),
  `server-cache-lru`, `server-dedup-props`, `server-hoist-static-io`,
  `server-no-shared-module-state`, `server-serialization`, `server-parallel-fetching`,
  `server-parallel-nested-fetching`, `server-after-nonblocking` (`after()`).
- **Client**: `client-passive-event-listeners`, `client-localstorage-schema`.
  (`client-swr-dedup` N/A: não usamos SWR nem lib de data-fetching no client:
  leitura é RSC, interatividade é React 19.)
- **Re-render**: `rerender-defer-reads`, `rerender-derived-state*`,
  `rerender-functional-setstate`, `rerender-lazy-state-init`, `rerender-transitions`,
  `rerender-use-deferred-value`, `rerender-use-ref-transient-values`, etc.
- **Rendering**: `rendering-content-visibility`, `rendering-hydration-*`,
  `rendering-activity`, `rendering-resource-hints`.
- **Advanced**: `advanced-effect-event-deps`, `advanced-event-handler-refs`,
  `advanced-init-once`, `advanced-use-latest`.

## Comandos

```bash
bun run lint               # oxlint (built-in + regras custom)
bun run lint:fix           # oxlint --fix
bun run typecheck          # next typegen && tsc --noEmit (gate do app)
bun run typecheck:tooling  # tsc -p tooling/tsconfig.json (regras custom)
bun run test               # bun test (testes Bun-nativos das regras)
bun run build              # next typegen && tsc --noEmit && bun --bun next build
```

## Nota sobre TypeScript 7 nativo + Next 16

O TypeScript 7 é o compilador nativo (port em Go). O pacote `typescript@7.0.2` expõe só
o binário `tsc` e as APIs `./unstable/*`: **não** tem `lib/typescript.js`, a API clássica
que o Next 16 importa para o type-check de build. Por isso o `next build` reclamava e tentava
reinstalar o `typescript` clássico.

A ponte oficial do Next 16 para TS7 nativo é o pacote **`@typescript/native-preview`**: quando
presente, o Next detecta o compilador nativo e pula o type-check próprio do build
(`verify-typescript-setup.js`). Por isso o projeto tem os dois, com papéis distintos:

- `typescript@7.0.2` → binário `tsc` usado em `typecheck`/`build` (a segurança de tipos real).
- `@typescript/native-preview` → satisfaz a detecção do Next para o `next build` passar.

## Regras custom (plugin `boilerplate`, em `tooling/oxlint-rules/`)

O que built-in não expressa, virou regra custom via `jsPlugins` (oxlint 1.77, alpha).
Cada uma tem teste Bun-nativo em `tooling/oxlint-rules/rules/__tests__/custom-rules.test.ts`
(roda `bunx oxlint` em fixtures: sem Node).

| Regra | Proíbe / Permite |
|-------|------------------|
| `boilerplate/enforce-boundaries` | direção `app→features→lib→shared`; `shared` é folha; feature não importa sibling feature |
| `boilerplate/no-index-barrel` | barrel em `index.*` (re-export nomeado **e** `export *`): cobre o gap do `oxc/no-barrel-file` |
| `boilerplate/no-use-cache` | `'use cache'`, `unstable_cache`, `cache:'force-cache'`, `fetch(..., { next: { revalidate: false \| >0 } })`: **permite `React.cache()`** (dedup ≠ staleness) |
| `boilerplate/no-force-static` | `dynamic='force-static'` e `revalidate=false \| >0` em **route segments** (`src/app/**`); permite `force-dynamic`/`revalidate=0` |
| `boilerplate/api-through-lib` | `fetch` cru pro backend fora de `src/lib/api/**` (string literal, template literal e env var `*_API_URL`) |
| `boilerplate/no-fetch-in-effect` | `fetch`/`apiClient`/`ky.*` dentro de `useEffect`/`useLayoutEffect` |
| `boilerplate/no-watch-in-effect` | react-hook-form `watch()` / `form.watch()` dentro de effect (use `useWatch`/derive) |
| `boilerplate/no-derived-state-in-effect` | `useEffect` cujo corpo é só um `setState` derivado das deps (bloco **ou** arrow concisa) |
| `boilerplate/no-manual-memo` | `useMemo`/`useCallback`/`memo` manuais (e os `React.*`); o React Compiler já memoiza. **Sem escape hatch**: supressão de lint é proibida (ADR-020) — se o compiler não enxerga a borda, mude o desenho |
| `boilerplate/no-forbidden-imports` | subpaths de libs banidas de data/http/validação/JWT (`swr`, `@tanstack/react-query` + devtools + query-core, `react-query`, `axios`, `zod`, `jsonwebtoken`, `jose`); fecha o gap do `no-restricted-imports` (que só casa o specifier exato). Reforça valibot só em `*.schema.ts` e ky só em `src/lib/api` |
| `boilerplate/no-assert` | `assert` / `node:assert` (import e chamada): forçar invariante em runtime mascara contrato errado; corrija o tipo na borda |
| `boilerplate/no-defensive-parse` | `try { JSON.parse / decodeURIComponent } catch` cujo catch só engole e devolve default (`null`/`[]`/`{}`/`""`); permite catch que trata de verdade |
| `boilerplate/no-schema-output-converter` | conversor cujo corpo é um único `return {...}` sobre o output de um `*.schema.ts` para tipo importado: isso é `transform()` no schema, não uma camada a mais |
| `boilerplate/no-catalog-literal-compare` | comparar id de catálogo por literal solto (`if (id === "x")`) no arquivo que define o registry; o literal mora só no registry |
| `boilerplate/no-passthrough-mapper` **(`warn`)** | mapper cujo corpo inteiro é cópia/rename de campos do mesmo parâmetro. Advisory pelo conflito com o mapper snake→camel da `api-contract` (ver seção abaixo) |
| `boilerplate/no-literal-dispatch` **(`warn`)** | função exportada que é só `if (x === "a") return "b"`. Advisory: a regra não conta callers |
| `boilerplate/no-focused-tests` | `test.only`/`it.only`/`describe.only` (a suíte passa verde pulando o resto); import-agnóstico p/ `bun:test`, onde o `jest/no-focused-tests` falha |

Diretiva de supressão de lint **não** é regra deste plugin, de propósito: uma regra de lint
pode ser desligada pela própria diretiva que ela proíbe. O guard é o script
`tooling/no-lint-suppression.ts`, rodado pelo `verify` via `git grep` (ADR-020).

Peso de asset não é lintável (o lint não lê bytes de arquivo): fica no guard
`tooling/no-heavy-public-assets.ts` (`verify` + pre-push, via `lefthook.yml`), que falha se
QUALQUER arquivo em `public/**` passar de 200 KB, independente do formato, sem
allowlist, porque exceção por formato/diretório vira buraco no gate. Para imagem
raster a saída é WebP/AVIF via `next/image` (gargalo nº1 de LCP).

Conexão regra↔skill (o lint impõe; a skill julga o que o lint não prova):
`no-manual-memo` ↔ `vercel-react-best-practices` / `workflow-new-feature`;
`no-forbidden-imports` ↔ `api-contract` / `core-principles`; `no-lint-suppression`
e `no-focused-tests` ↔ `core-principles`; `no-heavy-public-assets` ↔ `design-system`
(orçamento de LCP).

### Portada como advisory (`warn`): `no-passthrough-mapper`

A regra dispara sobre mapper de passagem (rename 1:1 sem conversão). Ela pega cerimônia
real na maioria dos casos, mas colide com um mapper que a skill `api-contract` **prescreve**:

- A `api-contract` obriga o `*.schema.ts` a manter os nomes snake_case do backend
  (`full_name`, `created_at`) e o domínio a expor camelCase, listando "API entrega
  snake_case → domain expõe camelCase; mapper em `utils/` (função pura)" como mapper legítimo.
- Um mapper que só faz esse rename com 2+ campos
  (`return { id: api.id, displayName: api.display_name, taxId: api.tax_id }`) é idêntico
  ao caso "fires: rename puro" da regra.
- Só que aqui o rename é load-bearing, não cerimônia: as chaves diferem de verdade.
  O fix que a regra sugere (devolver a row direto por subtipagem estrutural) é impossível,
  porque as chaves camelCase do domínio não existem no tipo snake_case da API.

Como supressão de lint é proibida no repo (`tooling/no-lint-suppression.ts`), severidade
`error` seria um bloqueio sem saída. Por isso ela entra como **`warn`**: levanta o candidato
na review sem reprovar o gate. O mesmo vale para `no-literal-dispatch`, que não consegue
contar callers e marcaria um mapper de literais com 3+ usos como falso-positivo.

Built-in que impõem o mesmo espírito por zona (via `overrides`): valibot só em `**/*.schema.ts`,
ky só em `src/lib/api/**`, `document.cookie` proibido, libs de JWT proibidas, default export
só em `src/app/**`, `import/no-relative-parent-imports`, `jsx-a11y`.

## Arquitetura imposta pelas regras

`app → features → lib → shared → externo` (DAG, direção única). `shared` é folha pura
(não importa nada interno; externo OK). Compartilhado entre features sobe para `shared`
(feature não importa sibling). Tudo isto é imposto por lint, não documentado em prosa.

## Política de runtime: Bun, não Node

O projeto é Bun ponta a ponta. `node` é proibido como **nosso** runtime (app/scripts/testes) :
enforçado pelo guardrail `tooling/oxlint-rules/rules/__tests__/no-node-runtime.test.ts`, que
falha se algum script do `package.json` invocar `node`/`--experimental-strip-types` ou se
aparecer artefato `.nodetest`/`.mjs`. Exceção inevitável: o **binário do oxlint** é um CLI Node
(`#!/usr/bin/env node`): é ferramenta de dev (como `git`/`ripgrep`), não o runtime da aplicação.

## Enforcement (os portões que rodam)

- **Pre-commit** (`lefthook.yml`): oxlint nos staged + `typecheck` + `typecheck:tooling` + `test`.
- **CI** (`.github/workflows/ci.yml`): grep-gates (backstop do jsPlugins alpha) + oxlint + test +
  typecheck do tooling + build (typegen → tsc → next build sob Bun).
- **Loop do agente** (`.claude/settings.json`, hook `Stop`): roda `typecheck` + `oxlint` e
  bloqueia "concluído" enquanto vermelho.
