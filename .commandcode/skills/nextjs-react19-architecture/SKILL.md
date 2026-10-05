---
name: nextjs-react19-architecture
description: "Padrões de arquitetura para React 19 + Next.js App Router: RSC por padrão, Server Actions, estado na URL, árvore de feature, boundaries server/client, contrato de entrega. Aciona em: arquitetura, estrutura de feature, árvore, boundaries."
---

# Next.js & React 19: Arquitetura

Use esta skill ao escrever e refatorar features React/Next.js. O objetivo não é só modernizar sintaxe, mas produzir uma árvore de trabalho limpa, previsível e leve por padrão.

> Skill de arquitetura do **módulo nextjs**. Estende o núcleo (`core-principles`, `layer-boundaries`, `no-barrel-policy`, `naming-conventions`, `typescript-strict`, `api-contract`). Performance RSC/waterfall/bundle → `vercel-react-best-practices`.

## Mentalidade obrigatória

- **Arquitetura acima de cosmética.** Tamanho de arquivo, agradar o lint e número de extrações não são métricas de sucesso.
- **Realidade antes de ideologia.** Não proponha Server Components, Server Actions ou `use()` sem antes verificar auth, camada de request, fluxo de upload e restrições de runtime.
- **Hard cutover, não meio-refactor.** Ao substituir uma forma antiga, remova arquivos, exports e abstrações paralelas obsoletas.
- **Responsabilidade acima de fragmentação.** Extraia só quando o novo arquivo tiver papel claro e estável.
- **Tree first.** Antes de codar, defina a árvore final, os boundaries e o mapa de estado.

## Árvore de feature padrão

Toda feature nova ou refatorada deve tender para:

```text
src/features/<feature>/
  <feature>.schema.ts        # valibot: validação de borda + tipos (InferOutput)
  <feature>.actions.ts       # Server Actions (mutação) → revalidatePath / router.refresh
  components/
    shell/
    listing/
    form/
    details/
    sections/
    shared/
  hooks/
  helpers/
  constants/
  types/
```

Interpretação:

- `<feature>.schema.ts`: schemas valibot e tipos inferidos (`InferOutput`). valibot só aqui.
- `<feature>.actions.ts`: mutações como Server Actions; revalidam com `revalidatePath`/`router.refresh`.
- `components/shell`: composição/orquestração da feature.
- `components/listing|form|details|sections`: agrupamento por responsabilidade de interface.
- `components/shared`: componentes-folha internos da feature.
- `hooks/`: estado/interatividade client apenas (sem data-fetching, sem fetch em effect).
- `helpers/`: lógica pura, mapeamento (api → domain), derivação, normalização.
- `constants/`: contratos estáveis, ids, labels.
- `types/`: domínio, payload, shape de formulário.

Não há `api/queries|mutations|adapters`: **leitura de dados é RSC** em `src/app/**` chamando `apiClient(kyServer, "rota", schema)`. Rotas vivem em `src/app/**` (`page.tsx`/`layout.tsx`/`proxy.ts`): **NUNCA** `*.screen.tsx`.

## Arquitetura central

- **Server Components por padrão.** Todo componente é server até prova em contrário.
- **Isole a interatividade.** Empurre `"use client"` para as folhas absolutas da árvore.
- **Não crie falso server-first.** Se a entrada continua client-heavy por limitação de infra, deixe isso explícito.
- **Streaming por padrão.** Use `<Suspense>` em volta de server components lentos.
- **Minimize serialização.** Não mande payloads enormes do server pro client sem necessidade.

## Data fetching & mutations

- **Leitura = Server Component (RSC).** Buscar no servidor via `apiClient(kyServer, "rota", schema)` (em `lib/api`), encaminhando o cookie. Fetches paralelos com `Promise.all`.

```tsx
// app/(app)/clientes/page.tsx: RSC, leitura paralela
import { apiClient } from '@/lib/api/client';
import { kyServer } from '@/lib/api/ky.server';
import { clientesSchema } from '@/features/clientes/clientes.schema';
import { filtrosSchema } from '@/features/clientes/filtros.schema';
import { ClientesList } from '@/features/clientes/components/listing/clientes-list';

export default async function ClientesPage(): Promise<React.ReactNode> {
  const [clientes, filtros] = await Promise.all([
    apiClient(kyServer, 'clientes', clientesSchema),
    apiClient(kyServer, 'clientes/filtros', filtrosSchema),
  ]);
  return <ClientesList clientes={clientes} filtros={filtros} />;
}
```

- **Mutação = Server Action.** Só use se auth/request/runtime suportarem sem gambiarra. Toda mutation repuxa fresco com `revalidatePath`/`router.refresh`. `React.cache()` (dedup por request) é permitido; sempre-fresco (`{ cache: 'no-store' }` quando precisar marcar).

```ts
// features/clientes/clientes.actions.ts: Server Action (mutação)
'use server';
import { revalidatePath } from 'next/cache';
import { apiClient } from '@/lib/api/client';
import { kyServer } from '@/lib/api/ky.server';
import { clienteSchema, type NovoCliente } from '@/features/clientes/clientes.schema';

export async function criarCliente(input: NovoCliente): Promise<void> {
  await apiClient(kyServer, 'clientes', clienteSchema, { method: 'post', json: input });
  revalidatePath('/clientes');
}
```

- **Prefira primitivas do React 19** (`useActionState`, `useOptimistic`, `useTransition`, `startTransition`) em vez de `useState` manual para loading/submit/erro.

Proibições (fetch em effect, React Query/SWR, `'use cache'`/`unstable_cache`/`revalidate>0`/`force-static`, valibot/ky fora da camada) o lint impõe: rode `bun run lint`. Waterfall/bundle/performance RSC → `vercel-react-best-practices`.

## Gestão de estado

- **URL como verdade.** Filtros, paginação, tabs e estado compartilhável vão para `searchParams` quando faz sentido.
- **Colocate estado local.** `useState` vive no menor componente necessário.
- **key-based remount.** Use `key` para resetar uma subárvore (ex.: trocar o registro editado num form) em vez de um efeito de reset.
- **lazy init.** Quando o cálculo inicial é caro, `useState(() => compute())` em vez de `useState(compute())`.
- **Derive no render, não em effect.** Se dá pra derivar, derive direto:

```tsx
// ❌ const [fullName, setFullName] = useState("");
//    useEffect(() => setFullName(`${first} ${last}`), [first, last]);
// ✅
const fullName = `${first} ${last}`;
```

Espelhar props em estado e "consertar" estado em sync effect o lint pega: rode `bun run lint`.

## Antipadrões React 19

Os baseados em effect/data-fetching (fetch em effect, espelhar props, sincronizar estados, React Query/SWR) o lint pega: rode `bun run lint`. Os que o lint **não** vê, evite a todo custo:

- `forwardRef` (React 19: `ref` é prop).
- `<Context.Provider>` como padrão (prefira composição/server).
- Controller hook que mistura domínio, navegação, submit, modais e UI state.
- Componente visual com `"use client"` sem API de browser ou interatividade real.

## Guardrails de refactor

- Não refatore por contagem de linhas.
- Não crie hooks/helpers pass-through.
- Não duplique componentes-folha ou contratos.
- Não mantenha dead exports "pra limpar depois".
- Não fatie lógica em muitos arquivos se a ownership fica incerta.
- Não mova arquivos entre pastas sem mudar o boundary arquitetural.

## Contrato de entrega

Toda entrega termina com:

- árvore final da feature;
- lista de arquivos que continuaram client e por quê;
- lista de `useEffect`, `refs` e `"use client"` removidos ou justificados;
- dead code removido;
- `bun run verify` verde (lint type-aware + oxfmt + typecheck + knip + testes + guards).

## Autochecagem antes de finalizar

`bun run lint` cobre os checks de effect/estado-derivado. Restam os arquiteturais:

1. Tem estado que deveria estar na URL?
2. Tem componente ou hook na pasta errada?
3. Tem hook grande demais pra sua responsabilidade?
4. Tem helper que deveria ser puro mas ainda depende de React?
5. Sobrou algum `"use client"`?

Se qualquer resposta for sim, a arquitetura ainda pode melhorar.
