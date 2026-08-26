# Padrões de código: boilerplate

Documento canônico (humano **e** agente). São **regras, não opções**: quando há um
caminho prescrito, é o único. A maioria é **imposta** por oxlint/typecheck (coluna
"imposto por"); o que não é lintável é convenção obrigatória mesmo assim.

Visão geral da arquitetura: `ARCHITECTURE.md`. Decisões e porquê: `MEMORY.md`.
Mapeamento regra↔skill: `VERCEL-OXLINT-MAPPING.md`.
Julgamento da pré-review: `.claude/docs/guardrails-catalog.md`.

---

## 1. Dados (RSC-puro, sempre fresco)

**Leitura de dados = Server Component.** Buscar no servidor, encaminhando o cookie.

```tsx
// app/(app)/clientes/page.tsx : RSC
export default async function ClientesPage(): Promise<React.ReactNode> {
  const clientes = await apiClient(kyServer, "clientes", clientesSchema);
  return <ClientesList clientes={clientes} />;
}
```

- ❌ Não buscar dados no client. ❌ Não usar SWR/React Query. ❌ Não `fetch`/`watch` em `useEffect`.
- ❌ Cache: `'use cache'`, `unstable_cache`, `cache: 'force-cache'`, `revalidate = false | >0`, `dynamic: 'force-static'`. ✅ `React.cache()` (dedup por request).
- ✅ Fetches paralelos com `Promise.all` (sem waterfall).
- ✅ **`cacheComponents` ligado é streaming, não cache:** a subárvore que lê dado fica sob
  `<Suspense>`, o shell estático sai no primeiro byte e o dado chega em streaming. Cada
  request busca fresco. Sem o `<Suspense>`, o build reprova com `blocking-prerender-dynamic`.
  Exemplo real: `src/app/perfil/page.tsx`.
- **Mutação de dado** = Server Action → `revalidatePath`/`router.refresh`.
- **Imposto por:** `boilerplate/no-use-cache`, `boilerplate/no-force-static`, `boilerplate/no-fetch-in-effect`, `boilerplate/no-watch-in-effect`, `no-await-in-loop`.

## 2. Bordas: validação e HTTP

**valibot só em `*.schema.ts`.** O schema exporta o schema **e** o tipo inferido.

```ts
// features/clientes/clientes.schema.ts
// Named imports (NUNCA `import * as v`: import/no-namespace proíbe; e named
// import tree-shakeia, que é o ponto do valibot).
import { array, object, string, type InferOutput } from "valibot";
export const clientesSchema = array(object({ id: string(), nome: string() }));
export type Cliente = InferOutput<typeof clientesSchema>[number];
```

**ky só em `lib/api`; backend só via `apiClient`** (que exige um validator → impossível buscar sem validar).

```ts
// ❌ em qualquer lugar fora de lib/api:
const r = await fetch("https://api.example.com/clientes");   // proibido
// ✅
const clientes = await apiClient(kyServer, "clientes", clientesSchema);
```

- **Imposto por:** `no-restricted-imports` (valibot/ky por zona), `boilerplate/api-through-lib`.

## 3. Componentes

- **RSC por padrão**; `'use client'` só nas folhas interativas.
- **Return type obrigatório** em funções nomeadas/componentes (callbacks inline isentos).
- **Sem barrel** (`index.ts` de re-export).

```tsx
"use client";
export function Botao({ onClick }: BotaoProps): React.ReactNode { /* ... */ }
```

- **Imposto por:** `typescript/explicit-function-return-type`, `boilerplate/no-index-barrel`, `react/*`, `jsx-a11y/*`.

## 4. Autenticação (no código)

- RSC/Server Action: ler cookie via `next/headers` e **encaminhar** ao backend.
- **Nunca** decodificar/validar/assinar JWT no front (sem `jose`/`jsonwebtoken`).
- Cookies públicos (`user_role`, `authorities`) = **só dica de UI**, nunca authz.
- Não ler `document.cookie` no client.
- Refresh de token = `proxy.ts` (não `middleware.ts`).
- **Imposto por:** `no-restricted-imports` (jwt libs), `no-restricted-properties` (`document.cookie`), guardrail `proxy.ts`.

## 5. TypeScript

- ❌ `any` explícito. ❌ type assertion `x as T` / `<T>x`: **exceto `as const`**. ❌ non-null `!`. ❌ `assert` / `node:assert`.
- ✅ `import type` consistente. ✅ validar resposta crua (nunca `as` pra "forçar" o tipo do backend).
- Confie no contrato validado: sem narrowing/fallback para shapes que o schema ou o fluxo
  anterior já excluiu (detalhe em §9). Tipagem de third-party mais larga que o runtime:
  corrija o tipo **uma vez** na borda de import (tipo local / binding tipado), sem `!`,
  sem `assert`, sem `if/throw` cerimonial nem `?? 0` no hot path.
- **Imposto por:** `typescript/no-explicit-any`, `typescript/consistent-type-assertions` (`never`), `typescript/no-non-null-assertion`, `typescript/no-unsafe-type-assertion`, `typescript/consistent-type-imports`, `boilerplate/no-assert`, `no-restricted-imports` (`assert` / `node:assert`).

## 6. Dead code

- Sem variáveis/imports/parâmetros não usados (prefixe `_` se intencional), sem código inalcançável.
- **Imposto por:** `no-unused-vars`, `no-unreachable`, `no-unused-labels`, `no-unused-private-class-members`.

## 7. Runtime

- **Bun**, sempre. ❌ `node`/`--experimental-strip-types`. ❌ reinstalar `typescript` clássico.
- **Imposto por:** guardrail `no-node-runtime` (test) + grep-gate de CI.

## 8. Formulários

Padrão: **react-hook-form + `valibotResolver`** (o schema vive em `*.schema.ts`).

```tsx
"use client";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { loginSchema, type LoginInput } from "@/features/auth/schemas/login.schema";

const form = useForm<LoginInput>({ resolver: valibotResolver(loginSchema) });
```

- ✅ O **mesmo schema valibot** valida no client (UX) **e** revalida no server/backend. Validação no client é UX: **nunca** a fronteira de segurança.
- ✅ Submit de **mutação de dado** → Server Action (+ `revalidatePath`/`router.refresh`). Submit de **auth que seta cookie** (login/refresh) → chamada **browser-direct** (o `Set-Cookie` precisa pousar no browser).
- ❌ Não usar `watch()` em `useEffect`: use `useWatch` ou derive no render. UI otimista = `useOptimistic`.
- **Por que RHF (e não `useActionState` puro):** área autenticada (CRM) com forms ricos (validação por-campo, máscaras, campos dinâmicos) + o constraint do cookie de auth. Em forms públicos/simples, `useActionState` seria preferível (menos bundle). Rationale completo em `MEMORY.md` (ADR-015).
- **Imposto por:** `boilerplate/no-watch-in-effect`; valibot confinado por `no-restricted-imports`.

---

## 9. Extração, `shared` e confiança no contrato

- **Um caller** → inline. **Segundo caller real** → extração local (feature ou `lib`).
- **Abstração genérica** (factory, provider, hook genérico) → **3 callers** concretos.
- **Primitivo concreto de produto** (`DateRangePicker`, `calendar-month`, formatters de
  data/moeda) → pode ir direto pra `shared` quando o destino é reutilização entre
  features; isso é **colocação**, não abstração especulativa.
- **Normalizar só na borda externa** (request/response do backend, submit de form).
  ❌ Normalizer de dado que o próprio app produziu (prop do RSC, estado interno,
  entrada já tipada de um catálogo const).
- **Regra de negócio, limiar e agregação** → backend. O front envia parâmetros opacos e
  renderiza a resposta. Não espelhe campo de domínio que a API já tipou.
- **URL que nós escrevemos**: valor inválido → redirect/canônico; sem default silencioso
  nem segunda camada de parse. Exceção: input não confiável (link compartilhado, edição
  manual na barra de endereço).
- **Ids de catálogo**: sempre via registry const — ❌ literal solto em `if`/`switch`/`===`
  repetindo o mesmo id.
- **Estado impossível** (tipo/schema/control flow já garantiu): confie no narrowing —
  ❌ `?? `, `|| []`, `?? 0`, branch cerimonial, `assert`, `!` (§5).
- **Wrapper que só repassa** (inclusive pro `apiClient`) → chame direto. Helper cerimonial
  (`isRecord`, `ensureArray`) sobre valor que o schema já garantiu → apague.
- **Imposto por (parcial):** `boilerplate/no-passthrough-mapper`,
  `boilerplate/no-defensive-parse`, `boilerplate/no-catalog-literal-compare`,
  `boilerplate/no-schema-output-converter`, `typescript/no-unnecessary-condition`;
  o restante é julgamento, reforçado pelos hooks de agente e pela skill `pre-review`.

---

## Antes de concluir

O gate canônico é um só: **`bun run verify`** (lint type-aware · oxfmt · typecheck do
app/testes/tooling · knip · testes · guard de supressão · budget de assets).
No loop de iteração, `bun run verify:fast` basta.
Se uma regra te bloquear, **siga o padrão**: não suprima a regra.
