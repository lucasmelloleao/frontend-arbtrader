---
name: naming-conventions
description: 'Use quando estiver criando qualquer arquivo, função, hook, componente, tipo, constante, schema, server action ou arquivo de teste novo. Sintomas: prestes a criar arquivo, escolher nome, renomear símbolo, ou revisar PR onde os nomes parecem ruins (genéricos, abreviações, sem domínio).'
---

# Naming Conventions

## Visão geral

Regra de nomenclatura única e consistente. Features de referência: `src/features/auth/` e `src/features/<feature>/`. (Exemplos abaixo usam um domínio CRM ilustrativo: adapte ao seu e às extensões da sua stack.)

## Quando usar

- Criando arquivo novo
- Nomeando função, hook, componente, tipo, constante
- Revisando PR (`/review`, `/audit`)
- Migrando código antigo (`workflow-refactor`)

## Arquivos & diretórios

| Elemento               | Convenção                | Exemplo                                          |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| Diretórios             | kebab-case               | `components/`, `contact-card/`                   |
| Component files (.tsx) | kebab-case               | `lead-card.tsx`, `login-form.tsx`                |
| Route files (App Router) | nome fixo do Next      | `page.tsx`, `layout.tsx`, `proxy.ts`             |
| Action files (.ts)     | kebab-case + `.action`   | `create-lead.action.ts`, `login.action.ts`       |
| Hook files (.ts)       | kebab-case com `use-`    | `use-leads.ts`, `use-login.ts`                   |
| Schema files (.ts)     | kebab-case + `.schema`   | `create-lead.schema.ts`                          |
| Type files (.ts)       | kebab-case + `.types`    | `api.types.ts`, `domain.types.ts`, `ui.types.ts` |
| Constant files (.ts)   | kebab-case               | `status-colors.ts`, `layout-tokens.ts`           |
| Utility files (.ts)    | kebab-case               | `format-lead-data.ts`, `mask-phone.ts`           |
| Test files             | kebab-case + `.test`, em `__tests__/` | `__tests__/lead-card.test.tsx`, `__tests__/use-leads.test.ts` |
| Index/barrel           | **proibido (todo barrel)** | vide `no-barrel-policy`                        |

> **`proxy.ts`** é o middleware do Next 16 (renomeado de `middleware.ts`): arquivo de projeto, não um special file por-rota do App Router como `page.tsx`/`layout.tsx`.
> **`route.ts`** (Route Handlers) está ausente de propósito: com `api-through-lib` + backend externo, este projeto não cria API routes próprias.
> **Testes** ficam em `__tests__/` ao lado do código que cobrem (ex.: `feature/components/__tests__/lead-card.test.tsx`).

## Nomenclatura de código

| Elemento                | Convenção           | Exemplo                             |
| ----------------------- | ------------------- | ----------------------------------- |
| Components              | PascalCase          | `LeadCard`, `LoginForm`             |
| Hooks                   | camelCase com `use` | `useLeads`, `useLogin`              |
| Functions               | camelCase           | `handleLeadSelect`, `formatPhoneBR` |
| Variables               | camelCase           | `leadCount`, `isLoading`            |
| Constants primitive     | UPPER_SNAKE_CASE    | `API_TIMEOUT`, `MAX_RETRIES`        |
| Constants config/objeto | camelCase           | `defaultFilters`, `statusColors`    |
| Types                   | PascalCase          | `LeadCardProps`, `LoginCredentials` |
| Enums/unions            | PascalCase          | `LeadStatus`, `ActionType`          |

## Organização de types

Múltiplas categorias → `types/` folder:

- `api.types.ts`: espelho exato do backend (snake_case se vem snake_case)
- `domain.types.ts`: entidades de negócio (camelCase, Date em vez de string ISO)
- `ui.types.ts`: props, UI state, navigation params

Categoria única < 50 linhas → `types.ts` (arquivo, não folder).

## Sub-organização de componentes

4+ componentes → quebrar:

- `components/sections/`: blocos de tela (header, content, footer)
- `components/shared/`: peças pequenas reutilizáveis dentro da feature
- `components/forms/`: formulários

1–3 componentes → flat em `components/`.

## Princípios

1. **Domain-driven**: prefixar com domínio: `Lead`, `Seller`, `Schedule`, `Vehicle`
2. **Semantic**: descreve propósito, não implementação: `useLeadProgress` não `useData`
3. **Sem redundância de path**: `helpers/format.ts` não `helpers/format-helpers.ts`
4. **Sem nome genérico**: proibido: `data`, `item`, `list`, `info`, `component`, `stuff`, `helper`, `manager`
5. **Sem abreviação**: `leadCount` não `ldCnt`. Exceção: `API`, `URL`, `id`, `JSON` (universalmente conhecidos)
6. **Symmetry de domínio**: `create-lead.action.ts` ↔ `create-lead.schema.ts` ↔ `use-create-lead.ts`
7. **Rotas em `src/app`**: arquivos de rota usam nome fixo do Next (`page.tsx`, `layout.tsx`, `proxy.ts`), nunca `*.screen.tsx`

## Antipadrões

| Errado                             | Certo                                               |
| ---------------------------------- | --------------------------------------------------- |
| `UserList` (component)             | `Users`                                             |
| `DataManager`                      | Nome específico para o que gerencia                 |
| `helperFunction`                   | Nome descrevendo o que faz                          |
| `handleClick` (genérico)           | `handleLeadSelect`                                  |
| `MyComponent.tsx`                  | `my-component.tsx`                                  |
| `types.ts` com 200 linhas          | `types/api.types.ts` + `types/domain.types.ts`      |
| 40 componentes flat                | Organizados em `sections/shared/forms`              |
| `users.ts` (sem extensão de papel) | `create-user.action.ts`, `use-users.ts`, `user.types.ts` |

## Sinais de alerta: PARE

- Nome contém: `data`, `info`, `list`, `item`, `manager`, `helper`, `stuff`, `thing`
- Abreviação não-óbvia (`cfg`, `mgr`, `hlpr`)
- Arquivo `PascalCase.tsx` em vez de `kebab-case.tsx`
- `types.ts` com mais de 50 linhas (precisa quebrar)
- 4+ componentes em `components/` flat (precisa sub-folder)
- Arquivo de rota em `src/app` com nome custom (deveria ser `page.tsx`/`layout.tsx`/`proxy.ts`)
- Arquivo `*.screen.tsx` (proibido: rotas vivem em `src/app`)

## Racionalizações comuns

| Desculpa                                                              | Realidade                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| "É um helper genérico mesmo"                                          | Helper genérico é red flag. Nome diga o que faz: `formatLeadData`, `maskPhone`. |
| "Abreviei só pra não ficar longo"                                     | Lê-se mais do que escreve. Verboso > críptico.                                  |
| "Esse component só tem props básicas, nem precisa de nome de domínio" | Sem domínio, em 3 meses ninguém sabe o que é. `Card` vs `LeadCard`.             |
| "types.ts único fica mais fácil de achar"                             | Achar X num arquivo de 300 linhas é pior que abrir `api.types.ts`.              |

## Verificação

```bash
# Arquivos com nome incorreto (PascalCase)
find src -type f -regex ".*/[A-Z][a-zA-Z]*\.tsx?$" -not -path "*/node_modules/*"
# Saída esperada: vazia

# Arquivos .screen.tsx (proibidos: rotas vivem em src/app)
find src -name "*.screen.tsx" -not -path "*/node_modules/*"
# Saída esperada: vazia

# Nomes genéricos
rg "function (handleClick|formatData|getInfo|processList)\b" src/
```
