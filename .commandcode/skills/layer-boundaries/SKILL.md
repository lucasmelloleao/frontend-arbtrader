---
name: layer-boundaries
description: 'Use quando estiver criando ou alterando arquivos em `src/features/**`, ou checando o boundary de import entre as camadas `app → features → lib → shared`: components, hooks, server actions, schemas, types, utils, constants. Sintomas: useQuery dentro de .tsx, regra de negócio dentro de componente, schema com transform de UI, types/api misturando camelCase, util importando React, prop opcional sem default ou justificativa.'
---

# Layer Boundaries

## Visão geral

A arquitetura é um DAG de direção única: `app → features → lib → shared`. Cada artifact em `src/features/**` tem **uma e somente uma** responsabilidade, e cada camada só importa para baixo. Esta skill é a régua. Cruzar a linha é violação: sem fallback, sem "mas é um caso pequeno", sem "depois eu separo".

## Quando usar

- Antes de criar qualquer arquivo novo em `src/features/`
- Ao revisar PR (`/review`, `/audit`)
- Quando o agente sente vontade de "só por aqui um useQuery rapidinho no componente"
- Quando aparece prop opcional sem default

## Quando NÃO usar

- Em `lib/` e `shared/` (camadas com regras próprias: ver `ARCHITECTURE.md`)
- Em `app/`/rotas (`page.tsx`/`layout.tsx`/`proxy.ts` são thin wrappers de composição, não carregam regra)
- Para infra de teste (`__mocks__`, setup de teste)

## Regras centrais: a matriz

### Camadas (DAG): `app → features → lib → shared`

| Camada            | Pode importar                          | Responsabilidade única                                          | NÃO pode                                                                                              |
| ----------------- | -------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `app/`            | tudo                                   | Rotas, layouts, composição. Leitura de dados em RSC.           | Conter regra de negócio reutilizável. Ser importada por `features`/`lib`/`shared`. `*.screen.tsx`.    |
| `features/<dom>/` | `shared`, `lib`, a própria feature     | Slice de domínio: componentes, server actions, `*.schema.ts`.  | Importar **sibling feature**. Importar `app`. Barrel (`index.ts` de re-export). `ky`/`fetch` cru.     |
| `lib/`            | `shared`, externo                      | Infra: `api/` (ky + `apiClient`), `auth/`, `env`, `proxy`.     | Importar `features`/`app`. Usar `ky` fora de `lib/api`.                                               |
| `shared/`         | só externo                             | Folha pura: `ui/`, `utils/`, `schemas/`, `types/`.            | Importar **qualquer coisa interna** (`app`/`features`/`lib`).                                         |

O que é compartilhado entre features **sobe para `shared`**: feature nunca importa feature. Aliases só `@/*`, sem import relativo de pai. Imposto por `boilerplate/enforce-boundaries`, `boilerplate/no-index-barrel`, `import/no-relative-parent-imports`.

### Dentro da feature: responsabilidade por artefato

| Artefato               | Responsabilidade única                                                                          | NÃO pode                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/**/*.tsx`   | Renderizar JSX. Receber dados/callbacks por prop. Compor outros componentes.                   | `useQuery`/`useMutation`/React Query/SWR, `useEffect` com fetch, `fetch`/`ky` pro backend, regra de negócio, declarar constantes ou subcomponentes inline, ler `document.cookie` |
| `*.actions.ts`         | Server Action (`"use server"`): mutação via `apiClient` + `revalidatePath`/`router.refresh`.   | Cache no client. `fetch`/`ky` cru pro backend (vai por `apiClient`). Formatação para UI.                                                                        |
| `hooks/use-*.ts`        | Estado React. Interatividade client. Side-effects orquestrados (sem fetch).                    | JSX. Ler tema/cor direto. Lib de data-fetching. Fetch em `useEffect`. Estado derivável em render.                                                               |
| `*.schema.ts`           | valibot schema 1:1 com payload do backend OU regra de validação de formulário. Mensagens em PT-BR. | `import * as v` / Zod. Transform de exibição (máscara de telefone para UI). Side-effect.                                                                    |
| `types/api.types.ts`    | Espelho exato do contrato do backend (snake_case, nullability igual, optionality igual).       | Tipos de UI/props. Tipos de domínio já mapeados.                                                                                                                |
| `types/domain.types.ts` | Entidade de negócio após mapper (camelCase, Date em vez de ISO string, branded ids se houver). | Snake_case. Shape do servidor.                                                                                                                                  |
| `types/ui.types.ts`     | Props de componente, estado de UI.                                                             | Campos do backend.                                                                                                                                              |
| `utils/*.ts`            | Funções puras: mapper (api → domain), format, mask.                                            | Importar React, hooks, `lib/api`. Side-effect.                                                                                                                  |
| `constants/*.ts`        | Valores estáticos: ids, layout tokens, mensagens fixas.                                        | Funções com side-effect. Estado mutável.                                                                                                                        |

**Como** buscar/mutar dados (RSC, Server Action, fetches paralelos, por que sem React Query/SWR) → skill `nextjs-react19-architecture`. Aqui importa só o boundary: leitura mora no RSC em `app/`, mutação em `*.actions.ts` da feature.

### Opcionalidade é rígida

- **Toda prop opcional** precisa: (1) default explícito no destructuring OU (2) JSDoc explicando por que `undefined` é semanticamente diferente de "valor ausente".
- **Todo acesso ao backend** passa por `apiClient` em `lib/api` (valida com valibot por construção). Proibido `fetch`/`ky` cru pro backend fora de `lib/api`, e proibido `try { ... } catch { /* ignore */ }`.
- **Toda mensagem ao usuário** vem de constante nomeada em PT-BR. Proibido renderizar `error.message` cru.

## Referência rápida: Decisão rápida

| Quero fazer X em arquivo Y                                                  | Está certo?                                                     |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `useQuery` em `components/lead-card.tsx`                                    | ❌ → data-fetching no client é proibido; o **como** está em `nextjs-react19-architecture` |
| `formatPhoneBR(phone)` dentro de `apiClient`/`lib/api`                      | ❌ → `apiClient` entrega `phone: string` validado, util/component formata |
| `if (status === 'lost') router.replace('/home')` em `components/header.tsx` | ❌ → mover pro hook ou Server Action                            |
| `try { ... } catch (e) { Toast.show('Erro') }` em `lib/api`/action          | ❌ → propaga, a camada de cima trata, mensagem vem de constante |
| `const STATUS_COLORS = { ... }` dentro de função componente                 | ❌ → file-level ou `constants/`                                 |
| Sub-componente declarado dentro de outro `function Foo()`                   | ❌ → extrair pra arquivo próprio em `components/shared/`        |
| Prop `variant?: 'primary' \| 'secondary'` sem default                       | ❌ → `variant = 'primary'` no destructuring OU JSDoc explicando |

## Sinais de alerta: PARE

Se você está prestes a:

- Buscar dados no client (React Query/SWR/`useQuery`/`useMutation`): proibido; o **como** está em `nextjs-react19-architecture`
- Usar `ky` ou `fetch` pro backend fora de `lib/api` (use `apiClient`)
- Renderizar `{error.message}` direto no JSX
- Catch sem rethrow nem logger.error
- Declarar `function SubComponent()` dentro de outro componente
- `useState` para algo que poderia ser derivado em render
- Schema valibot com transform que muda formato para exibição (BR currency, máscara)

**Pare. Mova para a camada certa antes de continuar.**

## Racionalizações comuns

| Desculpa                                                 | Realidade                                                                                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| "É só um componente pequeno, dá pra usar useQuery aqui"  | React Query/SWR são banidos por completo. Leitura é RSC; interatividade é React 19. Cruzar a linha hoje vira a confusão de amanhã.   |
| "O `apiClient` formata porque é mais conveniente"        | Formatar na borda = qualquer consumidor (outra page, teste, debug) recebe dado já mastigado. `apiClient` entrega dado cru validado.  |
| "Esse try/catch é só pra não quebrar a tela"             | Engole erro = bug silencioso. Propaga e deixa a camada de cima decidir.                                                             |
| "Vou separar depois"                                     | "Depois" não existe. Separa agora ou não faz.                                                                                       |
| "É um helper trivial, posso deixar inline no componente" | Helper inline = vira closure dentro do render = re-criado todo render = perde estabilidade de referência. File-level.               |
| "Default da prop não importa porque sempre passo"        | "Sempre passo" hoje. Amanhã alguém adiciona um caller. Default explícito ou JSDoc dizendo "undefined é diferente de X".             |

## Verificação

O gate canônico é `bun run lint` (oxlint + `boilerplate/*`: `enforce-boundaries`, `no-index-barrel`, `api-through-lib`, `no-fetch-in-effect`, `no-watch-in-effect`, `no-derived-state-in-effect`) + `bun run typecheck`. Rode antes de continuar: ele já pega React Query/SWR no client, `ky`/`fetch` fora de `lib/api` e componente aninhado (`react/no-unstable-nested-components`).

O que o lint NÃO pega: confira à mão:

```bash
# error.message cru no JSX (mensagem deve vir de constante PT-BR)
rg -t ts "error\.message" src/features/ \
  && echo "REVISAR: error.message cru no JSX?"
```

- `api.types.ts` × `domain.types.ts`: o espelho do backend (snake_case) não vazou para o domínio (camelCase), nem o contrário.
- Opcionalidade: toda prop opcional tem default explícito no destructuring OU JSDoc dizendo por que `undefined` é semântico.
