---
name: no-barrel-policy
description: "Use quando estiver prestes a criar um arquivo `index.ts` de re-export, escrevendo um import vindo de uma pasta de feature, ou revisando PR que adicione barrel files. Sintomas: `import { x, y, z } from '@/features/auth'`, `export * from './foo'`, `index.ts` em `hooks/`, `components/`, `schemas/`, `types/`, ou no root de uma feature."
---

# No Barrel Policy

## Visão geral

Zero barrel em todo o projeto (`src/**`). Imports por path completo. **Não há exceção**: nem `src/shared/ui/`. O lint cobre só parte disto: `boilerplate/no-index-barrel` mata barrel em `index.*` e `oxc/no-barrel-file` pega `export *`. Mas named re-export (`export { x } from`) em arquivo que **não é index** é GAP do lint: fica por disciplina humana. É justamente pra esse buraco que esta skill existe.

## Motivo

- Barrel cria importação opaca: lendo `import { useLogin } from '@/features/auth'` ninguém sabe onde mora `useLogin` sem abrir o `index.ts`.
- Barrel mascara dead code: re-export marca tudo como "usado", código morto escapa do lint.
- Barrel cria ciclos invisíveis: A re-exporta B que re-exporta A → erro de runtime que só aparece na produção.
- Barrel atrapalha tree-shaking: bundler conserva mais código do que precisa.

## Quando usar

- Toda vez que escrever um `import` envolvendo `src/features/`
- Toda vez que tentar criar `index.ts` em qualquer pasta de feature
- Ao revisar PR (`/audit`, `/review`)

## Quando NÃO usar

- `node_modules/`: não é nosso problema

## Regras centrais

1. **Proibido `index.ts` de re-export em todo `src/**`**
   - Sem `features/auth/index.ts`, `features/auth/hooks/index.ts`, `shared/index.ts`, `shared/ui/index.ts`, etc.
   - Existente → deletar e ajustar imports.

2. **Imports sempre por path completo**
   - ✅ `import { useLogin } from '@/features/auth/hooks/use-login'`
   - ❌ `import { useLogin } from '@/features/auth'`
   - ❌ `import { useLogin, loginSchema } from '@/features/auth/hooks'`

3. **Cada arquivo exporta o que SE chama**
   - `hooks/use-login.ts` exporta `useLogin` (named export). Default fica a cargo do `import/no-default-export` (exceção: rotas/layouts em `src/app/**`).
   - Múltiplos exports do mesmo arquivo só se forem coesos (ex.: `LoginFormData` + `LoginFormErrors` junto com `loginSchema` no `login.schema.ts`).

4. **Sem exceção**: nem o design system escapa
   - `shared/ui/` também não tem `index.ts` de re-export. Importe direto: `@/shared/ui/button`.
   - O lint pega `index.*` (`boilerplate/no-index-barrel`) e `export *` (`oxc/no-barrel-file`); named re-export fora de index continua proibido: por disciplina, não por lint.

## Referência rápida

| Cenário                     | Certo                                | Errado                                   |
| --------------------------- | ------------------------------------ | ---------------------------------------- |
| Importar hook               | `@/features/auth/hooks/use-login`      | `@/features/auth`                          |
| Importar schema             | `@/features/auth/schemas/login.schema` | `@/features/auth/schemas`                  |
| Importar tipo de API        | `@/features/auth/types/api.types`      | `@/features/auth/types` ou `@/features/auth` |
| Importar primitive UI       | `@/shared/ui/button`                   | `@/shared/ui` (barrel: proibido)          |
| Re-exportar pra "facilitar" | Não faz                                | `export * from './use-login'`              |

## Sinais de alerta: PARE

- Criando arquivo `index.ts` de re-export em qualquer pasta de `src/`
- Escrevendo `export * from`
- Importando 3+ símbolos de `@/features/<x>` em uma única linha
- Refatoração que "limpa imports" agrupando em barrel

## Racionalizações comuns

| Desculpa                                      | Realidade                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Fica mais limpo importar de `@/features/auth`" | Limpo no caller, opaco no codebase. Importar de path completo é auto-documentado.                    |
| "É o public API da feature"                   | Path completo já é o contrato. Se um arquivo é interno, o nome diz (`_internal.ts` ou subpasta `_`). |
| "O lint não reclama desse barrel"             | `boilerplate/no-index-barrel` (index.*) e `oxc/no-barrel-file` (`export *`) reclamam. Named re-export fora de index escapa do lint: mas continua barrel e esconde dead code. |
| "Sempre fizemos assim em outros projetos"     | Outros projetos não são este. Aqui a regra é zero barrel em features.                                |

## Verificação

```bash
# Lint cobre o que é automatizável: barrel em index.* e `export *`.
bun run lint

# GAP do lint: named re-export fora de index é disciplina humana. Cace na mão:
rg "^export \{.*\} from" src/ -g '!**/index.*'
# Saída esperada: vazia
```

## Helper de migração (quando encontrar barrel existente)

1. Listar o que o `index.ts` re-exporta.
2. Para cada símbolo, encontrar o arquivo real (`grep -r "export.*<simbolo>" src/features/<feature>/`).
3. Procurar todos os callers (`rg "from '@/features/<feature>'"`).
4. Reescrever cada caller para path completo.
5. Deletar o `index.ts`.
6. Rodar `bun run lint && bun run typecheck` para confirmar nada quebrou.
