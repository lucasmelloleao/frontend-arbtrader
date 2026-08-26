# MEMORY: log de decisões (ADR)

Registro **append-only** das decisões de arquitetura/toolchain e o **porquê**, incl.
alternativas descartadas. Doc canônico (humano e agente). Não reescrever histórico :
decisões revertidas viram uma **nova** entrada marcada como tal.

Formato por entrada: **Decisão · Contexto · Por quê · Alternativas descartadas · Status.**

---

## ADR-001: TypeScript 7 nativo
- **Decisão:** usar `typescript@7` (o port nativo em Go) como `tsc`, + `@typescript/native-preview` (o `tsgo`) como ponte do Next 16.
- **Contexto:** o `typescript@7` expõe o binário `tsc`, mas não o `lib/typescript.js` (a API JS clássica que o Next importa) → o `next build` tentava reinstalar o TypeScript clássico.
- **Por quê:** o Next 16 detecta o `@typescript/native-preview` e pula o type-check próprio; o `tsc` nativo faz a checagem real.
- **Precisão importante:** "não instalar o TypeScript clássico" significa **não voltar para o TS 5/6**. O pacote `typescript` na versão 7 **é** o compilador nativo — tê-lo no `package.json` é a decisão, não uma violação dela. Os dois pacotes convivem de propósito.
- **Alternativas descartadas:** `typescript` v5 (não é TS7); só `native-preview` (queríamos o `tsc` versionado).
- **Status:** ativo.

## ADR-002: Bun ponta a ponta; `node` proibido
- **Decisão:** Bun em dev/build/start/test (`--bun`), inclusive no container de produção. `node` proibido como runtime nosso.
- **Por quê:** stack rápida/coerente; o time decidiu Bun e2e.
- **Risco registrado:** Next em produção sob Bun é caminho não-oficial → exige smoke test do `output:'standalone'` sob Bun antes do deploy.
- **Nota:** o **oxlint** é um CLI Node (`#!/usr/bin/env node`): é ferramenta de dev (como git), não o runtime da app; não conta como violação.
- **Status:** ativo (deploy ainda não validado).

## ADR-003: Dados sempre frescos, sem cache
- **Decisão:** sem cache do Next (`'use cache'`, `unstable_cache`, `revalidate>0`, `force-static` proibidos). Leitura via RSC + Suspense. `React.cache()` (dedup por request) permitido.
- **Por quê:** é um CRM: frescor > performance de cache. É também o default do Next 16.
- **Alternativas descartadas:** ISR (introduz staleness).
- **Emenda (ADR-025):** `cacheComponents` foi adotado depois, e NÃO contradiz este ADR: com a subárvore de dado sob `<Suspense>`, o que é pré-renderizado é só a casca sem dado. Cada request continua buscando fresco.
- **Status:** ativo.

## ADR-004: Sem SWR / sem lib de data-fetching no client
- **Decisão:** nenhuma lib de data-fetching/cache no client. Interatividade via React 19 (`useActionState`, `useOptimistic`).
- **Por quê:** SWR é cache → contradiz o "sempre fresco" (ADR-003). RSC-puro é mais coerente.
- **Alternativas descartadas:** SWR, React Query.
- **Status:** ativo (revertido de uma escolha inicial por SWR).

## ADR-005: valibot (não zod) nas bordas, confinado a `*.schema.ts`
- **Decisão:** valibot para validação na borda, importável só em `*.schema.ts`.
- **Por quê:** mais leve que zod (importa pra bundle quando há validação no client); confinar centraliza a validação.
- **Alternativas descartadas:** zod (bundle maior); `zod/mini` (meio-termo não necessário).
- **Status:** ativo.

## ADR-006: ky como client HTTP, confinado a `lib/api`
- **Decisão:** ky em `lib/api`; todo acesso ao backend via `apiClient` (exige validator).
- **Por quê:** gateway único, tipado e validado; impede `fetch` cru espalhado.
- **Status:** ativo.

## ADR-007: Auth por cookie JWT; backend é a fonte de authz
- **Decisão:** cookie JWT same-site (emitido pelo backend); o front encaminha o cookie e **nunca** decodifica/valida/assina JWT. Cookies públicos só pra UI. Refresh no `proxy.ts`.
- **Contexto:** front e backend no mesmo eTLD+1 (`.example.com`) → cookie first-party `SameSite=Lax`, sem BFF/CSRF token.
- **Alternativas descartadas:** Better Auth/Clerk no front (auth e dados são do backend separado); BFF proxy dedicado (desnecessário com mesmo domínio).
- **Status:** ativo. Implementado no ADR-022: `src/proxy.ts` roteia por presença de cookie, `kyServer` encaminha o cookie ao backend, e o login é browser-direct (`features/auth`). Nenhuma linha decodifica JWT.

## ADR-008: Arquitetura feature-based; `shared` folha; sem cross-feature
- **Decisão:** camadas `app → features → lib → shared`; `shared` não importa nada interno; feature não importa sibling (compartilhado sobe pra `shared`). Sem barrel.
- **Alternativas descartadas:** camada `entities` (domínio do front é fino: vive no backend); import lateral livre entre features (vira spaghetti).
- **Status:** ativo.

## ADR-009: Guardrails impostos por oxlint, não por `.md`
- **Decisão:** struct/arch/pattern impostos por oxlint (built-in + overrides por zona + plugin custom `boilerplate` via `jsPlugins`). `.md` é referência, não enforcement.
- **Contexto:** código escrito por agentes → regra determinística > convenção textual.
- **Risco:** `jsPlugins` é alpha (sem semver) → oxlint **pinado** (hoje 1.75.0) + **grep-gate de CI** como backstop. Subir a versão exige rodar `bun test` das regras custom: elas são o canário da API do plugin.
- **Status:** ativo.

## ADR-010: `proxy.ts` (Next 16), não `middleware.ts`
- **Decisão:** lógica de borda (gate de rota, refresh de token) em `proxy.ts`.
- **Por quê:** o Next 16 renomeou `middleware.ts` → `proxy.ts`. Guardrail proíbe `middleware.ts`.
- **Localização (correção):** o arquivo é `src/proxy.ts` — raiz de `src`, irmão de `app/`, **não** dentro de `app/`. Ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Os docs diziam `src/app/proxy.ts`, que o Next simplesmente não carrega.
- **Status:** ativo.

## ADR-011: Patch do Next removido
- **Decisão:** não patchar o Next para silenciar o log do `native-preview`.
- **Por quê:** o patch (`bun patch`) tinha custo de manutenção (refazer a cada upgrade do Next) maior que o benefício (um log cosmético). Removido em "fix: remove patch".
- **Status:** ativo (log do native-preview reaparece: aceito).

## ADR-012: oxlint com `--disable-nested-config`
- **Decisão:** rodar oxlint com `--disable-nested-config` (lint/lefthook/CI/Stop hook).
- **Por quê:** worktrees aninhados (ex.: `.claude/worktrees/*`, ignorados no git) têm `.oxlintrc.json` próprio e eram lintados via nested-config. Com a flag, só o config raiz vale.
- **Status:** ativo.

## ADR-013: Branches e fluxo de PR
- **Decisão:** não prescrever modelo de branch: é **escolha do adotante**. Default do boilerplate: trunk-based em `main` (feature → PR → `main`), usado pelas skills `pr-ready`/`pr-creation`. Quem usa gitflow ajusta a branch base nessas skills.
- **Por quê:** cada time tem seu fluxo (trunk-based, gitflow, etc.); impor um cria atrito. `main` é o default git moderno e o menor denominador comum.
- **Status:** ativo.

## ADR-014: Docs canônicos + inject como resumo
- **Decisão:** `ARCHITECTURE.md`, `CODE-PATTERN.md`, `MEMORY.md` são a fonte canônica (humano e agente). O `SessionStart` inject vira um resumo curto que aponta pra eles.
- **Status:** ativo.

## ADR-015: Forms com react-hook-form + valibotResolver
- **Decisão:** formulários usam **react-hook-form + `valibotResolver`** (schema em `*.schema.ts`); o **mesmo schema revalida no server/backend** (client é só UX). Mutação de dado → Server Action; auth que seta cookie (login/refresh) → browser-direct.
- **Por quê:** app autenticado (CRM) com forms ricos (validação por-campo, máscaras, campos dinâmicos) e o constraint do cookie de auth (Server Action não entrega `Set-Cookie` ao browser). RHF minimiza re-render.
- **Alternativas descartadas:** `useActionState` + Server Action puro (default do Next, melhor pra forms públicos/simples e progressive enhancement, mas pobre em UX rica e incompatível com o login browser-direct). É preferível em páginas públicas: não é o caso aqui.
- **Custo aceito:** RHF + schema vão pro bundle do client (ok em área logada; mantemos validação server). `no-watch-in-effect` guarda o anti-pattern de `watch` em effect.
- **Status:** ativo (corrige a contradição anterior do CODE-PATTERN que sugeria `useActionState`).

## ADR-016: `AGENTS.md` como contrato comum; hooks compartilhados multi-host
- **Decisão:** os hooks de agente vivem em `tooling/agent-hooks/*.ts` (TypeScript, rodados pelo Bun) e cada host só aponta para eles pelo seu JSON: `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`. O `host.ts` normaliza a I/O dos três contratos. O `AGENTS.md` é a fonte canônica das regras que os três leem.
- **Por quê:** antes os hooks eram `.sh` dentro de `.claude/`, então Codex e Cursor rodavam sem guardrail nenhum — a regra existia só onde o `.md` era lido. Script único + JSON fino elimina a divergência entre hosts por construção, e `hook-configs.test.ts` reprova o gate se um host apontar para um script que não existe ou que estoura.
- **Detalhe:** os comandos resolvem o caminho com `$(git rev-parse --show-toplevel 2>/dev/null || pwd)`. O fallback importa: o comprador extrai o zip e abre o agente **antes** do `git init`; sem ele, todo hook morreria no `git rev-parse`.
- **Alternativas descartadas:** caminho relativo quebra quando o agente roda a partir de um subdiretório; duplicar o script por host garante drift.
- **Status:** ativo.

## ADR-017: Knip como gate de código morto
- **Decisão:** `knip` entra no `verify`; export, arquivo e dependência sem consumidor reprovam o gate.
- **Por quê:** o `no-unused-vars` do oxlint só enxerga dentro do módulo. Código morto cross-module é o que realmente acumula, e num boilerplate é pior: o comprador herda arquivos que ninguém chama e presume que são necessários.
- **Efeito imediato:** pegou o `server-only` órfão no `package.json` e forçou o `lib/api/ky.client.ts` a ter caller real — foi o knip que exigiu a tela de login, fechando o ciclo de auth que o `proxy.ts` já prometia ao redirecionar para `/login`.
- **Status:** ativo.

## ADR-018: `oxfmt` como formatter, com Markdown de fora
- **Decisão:** `oxfmt` formata código e JSON; `.oxfmtrc.json` ignora `**/*.md`. Roda no `PostToolUse` dos agentes, no pré-commit e no `verify` (`fmt:check`).
- **Por quê:** mesmo ecossistema do oxlint (um binário, zero config duplicada). Os docs canônicos são prosa mantida à mão — reformatá-los é churn sem valor e polui o diff da review.
- **Status:** ativo.

## ADR-019: Lint type-aware (`--type-aware` + `oxlint-tsgolint`)
- **Decisão:** `bun run lint` roda com `--type-aware`, ligando `no-unnecessary-condition`, `no-unsafe-type-assertion`, `consistent-return`, `no-redundant-type-constituents` e afins. Junto, `noUncheckedIndexedAccess` no `tsconfig.json`.
- **Por quê:** metade da doutrina do repo ("confie no tipo, sem fallback para caso que o tipo já impede") era só texto — nenhuma regra sintática pega `?? 0` sobre valor garantido. Type-aware é o que transforma essa regra em gate.
- **Por que `noUncheckedIndexedAccess` junto:** sem ele, `lista[0]` mente (o tipo diz `T`, o runtime pode dar `undefined`) e o `no-unnecessary-condition` acusa como morto um guard que na prática é necessário. Com `!` e `as` banidos, estreitar de verdade é a única saída honesta.
- **Achado na adoção:** ligou e reprovou dois pontos de código morto que estavam no repo desde sempre.
- **Status:** ativo.

## ADR-020: `no-lint-suppression` é script, não regra de lint
- **Decisão:** o guard contra diretivas de supressão saiu do plugin oxlint e virou `tooling/no-lint-suppression.ts`, rodado pelo `verify`.
- **Por quê:** uma regra de lint pode ser desligada pela própria diretiva que ela proíbe — o guard se anulava. Um `git grep` fora do linter, não. Usa `git grep` quando há repositório e cai para `grep -r` quando ainda não há (o comprador roda `verify` antes do `git init`).
- **Consequência:** a mensagem do `no-manual-memo` deixou de oferecer supressão como escape hatch — era a própria doutrina se contradizendo.
- **Status:** ativo.

## ADR-021: Pré-review com selo por HEAD como portão do PR
- **Decisão:** a skill `pre-review` (canônica em `.agents/skills/`, compartilhada pelos três hosts) revisa a branch com subagentes por domínio e grava `.agents/tmp/pre-review-<HEAD>.ok`. O hook `pre-pr-review-gate.ts` bloqueia a abertura de PR sem o selo do HEAD atual, e acima de 3000 LOC sem ack.
- **Por quê:** `pr-ready` é mecânico (lint/type/test/diff/secrets) e não pega o que custa caro na review humana: abstração especulativa, fallback defensivo, regra de negócio inventada no front, slop. Sem gate, a etapa vira opcional — e regra que dá para pular não é guardrail.
- **Cadeia:** `/pr-ready` → `/pre-review` → `/create-pr`. Não se sobrepõem.
- **Status:** ativo.

## ADR-022: `lib/api` entregue como reference implementation
- **Decisão:** o boilerplate entrega `lib/api` (`apiClient`, `kyServer`, `kyClient`, `base-url`, `endpoints`), `lib/env`, `src/proxy.ts` e duas features de exemplo (`auth`, `perfil`) — não só as regras.
- **Por quê:** as regras de lint, as skills e os docs sempre falaram de `apiClient(kyServer, rota, schema)`, mas o `src/` só tinha `layout.tsx` e `page.tsx`. Regra que aponta para código inexistente é a "regra que mente" que o `CLAUDE.md` proíbe, e o comprador teria de reconstruir a peça central antes da primeira feature.
- **Detalhe técnico:** o `apiClient` valida pela interface **Standard Schema** (`schema["~standard"]`), não pela API do valibot — é isso que permite `lib/api` validar sem violar o confinamento de `valibot` aos `*.schema.ts`. Por isso `@standard-schema/spec` é dependência de runtime.
- **Escopo consciente:** sem variante paginada e sem `lib/auth`. Zero caller = YAGNI (CODE-PATTERN §9), e o knip reprovaria. O `requestEnvelope` já está pronto para a variante paginada quando o primeiro endpoint pedir.
- **Status:** ativo.

## ADR-023: `bun.lock` versionado e `.gitignore` no pacote
- **Decisão:** `bun.lock` é commitado e o repo tem `.gitignore`/`.gitattributes`.
- **Por quê:** o CI roda `bun install --frozen-lockfile` — sem lockfile versionado ele falhava no primeiro push, ou seja, o produto saía com o CI vermelho por construção. Sem `.gitignore`, o primeiro `git add .` do comprador commitava `node_modules/`, `.next/` e `.env.local`.
- **Status:** ativo.

## ADR-024: Next 16.2 stable, não o canal preview
- **Decisão:** fixar `next@16.2.11` (stable). Sem `partialPrefetching` nem `experimental.useTypeScriptCli` (só existem no 16.3).
- **Contexto:** o 16.3 preview foi testado e quebra o build sob Bun em toda versão publicada no npm: com bun 1.3.4 estoura em `Expected CommonJS module to have a function wrapper`; com bun 1.3.14 (latest) o loader do React Compiler recusa a flag do Bun em `NODE_OPTIONS`. Só passa sem a flag, ou com um bun 1.4 canary que não está no registry.
- **Por quê:** "Bun ponta a ponta" (ADR-002) é inegociável e vendida como tal. Entre perder duas flags de preview e entregar um build que não roda na máquina do comprador, perder as flags é barato.
- **Revisitar quando:** o bun 1.4 for publicado como estável no npm. Aí o 16.3 volta à mesa.
- **Status:** ativo.

## ADR-025: `cacheComponents` ligado — streaming, não cache
- **Decisão:** `cacheComponents: true` no `next.config.ts`. A subárvore que lê dado fica sob `<Suspense>` (ver `src/app/perfil/page.tsx`).
- **Por quê:** dá shell estático no primeiro byte + dado em streaming (a rota sai como `Partial Prerender` no build). Isso **não** contradiz o ADR-003: nada fica em cache, o que é pré-renderizado é só a casca sem dado, e cada request busca fresco.
- **Consequência prática:** com a flag ligada, ler cookie/dado fora de um `<Suspense>` reprova o build com `blocking-prerender-dynamic`. É o Next forçando o padrão que a skill `vercel-react-best-practices` já prescrevia.
- **Caveat conhecido:** sob Bun o build imprime um aviso de que o Next não garante o comportamento de Cache Components por causa da implementação de `setTimeout` do runtime. O output sai correto; se um dia morder, remover a flag custa uma linha (a rota volta a ser dinâmica pura).
- **Status:** ativo.

## ADR-026: `react-perf` removido em favor do React Compiler
- **Decisão:** o plugin `react-perf` e as regras `jsx-no-new-*` saíram do `.oxlintrc.json`.
- **Por quê:** o React Compiler estabiliza props automaticamente (mesma razão do `boilerplate/no-manual-memo`). As regras eram redundantes e, na prática, proibiam qualquer handler de evento inline em client component — atrito sem ganho.
- **Status:** ativo.

## ADR-027: `oxlint-tailwindcss` fora, por enquanto
- **Decisão:** não adotar o plugin `oxlint-tailwindcss` (que barra paleta default e valor arbitrary).
- **Por quê:** ele só tem valor com um `@theme` real preenchido em `globals.css`, e aqui o design system é template — o `DESIGN.md` é para o adotante preencher. Ligar agora reprovaria qualquer classe do comprador antes de ele definir os tokens.
- **Revisitar quando:** o `DESIGN.md` do projeto adotante estiver preenchido e os tokens vivos no `@theme`.
- **Status:** não adotado (candidato).

## ADR-028: Baseline Next 16.3 alinhado ao Avante
- **Decisão:** alinhar o baseline compartilhável com o Avante atual: `next@16.3.0`, `react@19.2.8`, `react-dom@19.2.8`, `typescript@7.0.2`, `@typescript/native-preview@7.0.0-dev.20260707.2`, `bun@1.4.0-canary.1`, `oxlint@1.77.0`, `oxfmt@0.62.0`, `oxlint-tsgolint@7.0.2001`, Tailwind 4.3.3 e versões correspondentes dos tipos e ferramentas.
- **Configuração:** adotar `partialPrefetching`, `experimental.turbopackRustReactCompiler`, `experimental.useTypeScriptCli`, `output: "standalone"`, breakpoints de imagem e o rewrite genérico de `NEXT_PUBLIC_API_URL` em desenvolvimento. `partialPrefetching` depende de `cacheComponents`, como documentado pelo Next 16.3.
- **TypeScript:** remover `noUncheckedIndexedAccess` para coincidir com o `tsconfig.json` do Avante. O acesso potencialmente vazio em integração usa `.at(0)` e continua estreitado em runtime; a diferença de política fica deliberadamente registrada aqui como substituição do ADR-019 para este baseline.
- **Por quê:** Bun 1.4 canary é o runtime efetivamente usado pelo checkout e o build verde confirma que as capacidades novas do Next 16.3 funcionam juntas. O gate canônico (`bun run verify`) continua obrigatório.
- **Fora do alinhamento:** dependências específicas de produto, `oxlint-tailwindcss` e regras `avante/*` não entram no template sem tokens, consumidores ou contrato próprio. A PR #85 é referência de direção, não uma fonte para copiar enquanto permanece aberta e com gate vermelho.
- **Evidência:** `bun run verify` verde (121 testes) e `INTERNAL_API_URL=https://api.example.com NEXT_PUBLIC_API_URL=https://api.example.com bun run build` verde; o build imprime apenas o aviso conhecido do Bun sobre `setTimeout` em Cache Components.
- **Status:** ativo; ADR-019 e ADR-024 ficam superseded para as partes conflitantes deste baseline.
