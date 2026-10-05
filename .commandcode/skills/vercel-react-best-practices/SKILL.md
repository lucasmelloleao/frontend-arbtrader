---
name: vercel-react-best-practices
description: "Guia das 70 regras de performance da Vercel Engineering (8 categorias): metade já é imposta por oxlint, metade é arquitetural. Aciona em: RSC, performance, waterfall, bundle, re-render, streaming, hydration."
---

# Vercel React Best Practices

As 70 regras estão divididas em 8 categorias. **Metade é estaticamente verificável** e já vira
`error` no oxlint: não precisa pensar nelas, o lint barra. A outra metade é **arquitetural**
(runtime, fluxo de I/O, estrutura de dados): nenhum linter prova, então são guia para **geração e
review**. Esta skill cobre só a parte arquitetural; o que cada regra mapeia para qual lint está em
[`VERCEL-OXLINT-MAPPING.md`](../../../VERCEL-OXLINT-MAPPING.md).

> Doutrina da base (RSC-puro, sem React Query/SWR, sem cache de página, `React.cache()` ok): ver `CLAUDE.md` / `ARCHITECTURE.md`. Aqui foca-se só na performance arquitetural que o lint não prova.

## 1. Eliminating Waterfalls

Imposto por oxlint: `no-await-in-loop`, `promise/*`, `no-await-in-promise-methods` (ver mapping).

Arquitetural (gerar/revisar):
- **`server-parallel-fetching`**: fetches independentes vão em `Promise.all`, nunca `await` sequencial.
- **`async-api-routes`**: inicie a promise cedo, dê `await` o mais tarde possível (não bloqueie no que ainda não usa).
- **`async-cheap-condition-before-await`**: cheque condição barata (early-return) ANTES de disparar I/O.
- **`async-dependencies`**: só encadeie `await` quando o segundo fetch depende de fato do primeiro.
- **`async-suspense-boundaries`**: envolva subárvores com I/O em `<Suspense>` para streaming progressivo; não segure a página inteira por um fetch lento.

## 2. Bundle Size

Imposto por oxlint: `oxc/no-barrel-file`, `boilerplate/no-index-barrel`, `import/no-cycle`, `import/no-namespace` (ver mapping).

Arquitetural (gerar/revisar):
- **`bundle-dynamic-imports`**: componentes pesados ou abaixo da dobra entram via `next/dynamic` (code-split).
- **`bundle-defer-third-party`**: scripts de terceiros via `next/script` com a estratégia certa (`lazyOnload`/`afterInteractive`).
- **`bundle-conditional`**: import dinâmico para código que só roda numa branch (ex.: editor, gráfico, modal raro).
- **`bundle-preload`**: `preload` do chunk que o usuário vai pedir a seguir (hover/intenção).

## 3. Server-Side

Imposto por oxlint: plugin `nextjs/*` inteiro, `no-img-element`, `no-accumulating-spread`, `no-map-spread`, `boilerplate/api-through-lib` (ver mapping).

Arquitetural (gerar/revisar):
- **`server-auth-actions`**: autorização DENTRO da Server Action/RSC; nunca confie em gate do client.
- **`server-cache-react`**: `React.cache()` para deduplicar a MESMA leitura no mesmo render (dedup, não cache com staleness).
- **`server-parallel-nested-fetching`**: em árvores aninhadas, dispare o fetch cedo no pai (complementa `server-parallel-fetching` da seção 1).
- **`server-cache-lru`**: cache LRU em memória para dado caro e estável no servidor (≠ cache de página; não tem staleness de rota).
- **`server-hoist-static-io`**: I/O constante (config, fetch estático) sai de dentro do componente/loop.
- **`server-no-shared-module-state`**: sem estado mutável em escopo de módulo (vaza entre requests).
- **`server-dedup-props` / `server-serialization`**: passe só o necessário e serializável de RSC → client; não despeje objetos grandes.
- **`server-after-nonblocking`**: trabalho pós-resposta (log, analytics) em `after()`, fora do caminho crítico.

## 4. Client-Side

Imposto por oxlint: `unicorn/prefer-add-event-listener` (ver mapping).

Arquitetural (gerar/revisar):
- **`client-passive-event-listeners`**: `{ passive: true }` em listeners de `scroll`/`touch`/`wheel`.
- **`client-localstorage-schema`**: valide o que sai do `localStorage` com schema valibot (`*.schema.ts`); nunca confie no shape.
- **`client-swr-dedup`**: N/A: não usamos SWR/React Query. Leitura é RSC; interatividade é React 19.

## 5. Re-render

Imposto por oxlint (ver mapping): `react/no-unstable-nested-components`, `jsx-no-constructed-context-values`, `exhaustive-deps`, `react-compiler`. As regras `react-perf/jsx-no-new-*-as-prop` foram removidas: o React Compiler estabiliza props sozinho (ADR-026). Derived-state e lazy-init de estado vivem em `nextjs-react19-architecture` (+ `boilerplate/no-derived-state-in-effect`).

Arquitetural que resta aqui (gerar/revisar):
- **`rerender-transitions` / `rerender-use-deferred-value`**: `useTransition`/`useDeferredValue` para updates não-urgentes (filtro, busca).
- **`rerender-use-ref-transient-values`**: valores transitórios que não pintam UI ficam em `useRef`, não em state.
- **`rerender-defer-reads`**: leia contexto/store no nível mais baixo que precisa, para não re-renderizar a subárvore toda.

## 6. Rendering

Imposto por oxlint: `nextjs/no-sync-scripts`, `react/no-danger`, `self-closing-comp`, `jsx-no-target-blank` (ver mapping).

Arquitetural (gerar/revisar):
- **`rendering-hydration-*`**: sem mismatch SSR↔client: nada de `Date.now()`/`window`/`Math.random()` no primeiro render; `suppressHydrationWarning` só cirúrgico.
- **`rendering-content-visibility`**: `content-visibility: auto` (CSS) em listas longas fora da viewport.
- **`rendering-activity`**: `<Activity>` para manter montado/oculto sem desmontar (preserva estado, pré-render).
- **`rendering-resource-hints`**: `preconnect`/`dns-prefetch` para origens de terceiros críticas.

## 7. JavaScript Perf

Coberto quase inteiro por oxlint (`bad-min-max-func`, `prefer-set-has`, `prefer-includes`, `prefer-array-find/some/flat-map`, `only-used-in-recursion`: ver mapping). Resta só: em hot path, `Set`/`Map` para lookup O(1) e early-exit no loop.

## 8. Advanced

Sem equivalente de linter: todos arquiteturais (gerar/revisar):
- **`advanced-effect-event-deps`**: `useEffectEvent` para ler valor fresco dentro do effect sem re-disparar por mudança dele.
- **`advanced-event-handler-refs`**: handler estável via ref quando precisa de identidade fixa sem stale closure.
- **`advanced-init-once`**: inicialização única (ref/lazy state), não em effect com `[]`.
- **`advanced-use-latest`**: padrão `useLatest` para ler o valor mais recente em callback assíncrono sem re-subscrever.
