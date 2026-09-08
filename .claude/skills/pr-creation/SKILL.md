---
name: pr-creation
description: "Use quando o usuário quiser abrir um PR, digitar 'create PR', 'criar PR', 'abrir PR', 'pull request', ou após `pr-ready` retornar READY. Sintomas: feature pronta, branch precisa ser criada, descrição padronizada precisa ser gerada, gh CLI precisa ser invocado."
---

# PR Creation

## Visão geral

Automatiza criação de branch (naming por chave `<KEY>`) e abertura de PR via `gh` com descrição exaustiva e padronizada em PT-BR. Pré-requisito: `pr-ready` retornou READY.

## Quando usar

- Após `pr-ready` retornar READY
- Usuário pede "criar PR", "abrir PR"

## Quando NÃO usar

- `pr-ready` não retornou READY → volta pra `pr-ready` primeiro (pr-creation **confia** no veredito, não re-roda checks)

## Configurações padrão

- **Base**: lida da seção *Branch base* do `CLAUDE.md` (default `main`). **Não assuma**: confirme na Fase 0.
- **Reviewer**: `<reviewer>` (OPCIONAL: se não informado, omitir a flag `--reviewer`)
- **Idioma da descrição**: PT-BR

## Fase 0: coleta de informações

1. Receber a chave da issue (`<KEY>`).
2. Buscar o título no tracker (ex.: Jira via MCP Atlassian `getJiraIssue`). Se indisponível → perguntar ao usuário.
3. Determinar tipo de branch pelo prefixo da chave ou contexto:
   - `feature/`: nova funcionalidade
   - `bugfix/`: correção
   - `refactor/`: refactor
   - `hotfix/`: hotfix prod
4. Se usuário não especificar, inferir da descrição ou perguntar.
5. **Confirmar a branch base**: ler a seção *Branch base* do `CLAUDE.md`. Se ainda está no default `main` e o fluxo do time não foi confirmado, **perguntar uma vez** qual a base (ex.: `main`/`develop`) e **gravar a escolha no `CLAUDE.md`**. Nunca abrir PR contra uma base não confirmada.

## Fase 1: branch

Os comandos abaixo usam a branch base confirmada na Fase 0 (exemplo: `main`: substitua se o time usa outra).

```bash
git checkout main && git pull origin main
git checkout -b {type}/<KEY>
```

Se branch já existe → confirmar com usuário se usa essa.

## Fase 2: análise de diff

```bash
git diff main...HEAD --stat
git diff main...HEAD --name-only
git log main..HEAD --oneline
```

Categorizar arquivos: types, schemas, server actions, hooks, components, rotas (app router), helpers, validation, tests.

## Fase 3: template de descrição

```markdown
## Contexto

[Por que essa mudança existe: alinhamento com backend, objetivo]

## Mudanças técnicas

### Tipos

[Se tocou: campos, interfaces]

### API / Server Actions

[Endpoints alterados, Server Actions, JSDoc adicionado]

### Hooks

[Responsabilidade dos hooks novos/alterados]

### Componentes

[Componentes novos/alterados, virtualização de listas]

### Rotas (App Router)

[Páginas/segmentos, layouts]

### Helpers / Validation

[Helpers, valibot schemas]

## Arquivos modificados (N)

| Arquivo           | Mudança   |
| ----------------- | --------- |
| `path/to/file.ts` | Descrição |

## Arquivos novos (N)

| Arquivo          | Descrição |
| ---------------- | --------- |
| `path/to/new.ts` | Propósito |

## Verificação

- [x] `bun run lint`: 0 erros
- [x] `bun run typecheck`: 0 erros
- [x] `bun test`: testes passam
- [x] sem dead code (oxlint `no-unused-vars`/`no-index-barrel`)
- [x] `api-contract` aplicada (se contratos tocados)

## Related

- Issue: <KEY>
- Base: main

## Test plan

- [ ] Item de teste específico
- [ ] Item de teste específico
```

**Regras da descrição:**

- Remover subseções de "Mudanças técnicas" que não se aplicam
- Tabelas de arquivos listam TODOS do diff
- "Test plan" tem item específico, não genérico
- Verificações executadas de verdade (não marcadas no chute)
- PT-BR
- Detalhista

## Fase 4: abrir PR

`pr-creation` **confia no veredito READY do `pr-ready`**: não re-roda lint/typecheck/test nem o gate de diff. Se `pr-ready` não foi rodado ou não deu READY, volte pra ele antes.

```bash
git push -u origin {type}/<KEY>

# --reviewer é OPCIONAL: inclua a flag só se <reviewer> foi informado; senão, omita a linha.
gh pr create \
  --title "{type}/<KEY> - {título da issue}" \
  --body "$(cat description.md)" \
  --base main \
  --reviewer <reviewer>
```

Retornar URL do PR.

## Regras obrigatórias

- `pr-creation` CONFIA no veredito READY do `pr-ready`; não re-roda checks
- Sem push sem confirmação do usuário
- Descrição em PT-BR
- Title sempre: `{branch-name} - {título da issue}`
- Reviewer OPCIONAL; se não informado, omitir a flag `--reviewer`
- Base customizável; default `main`

## Referência rápida

| Cenário               | Ação                                   |
| --------------------- | -------------------------------------- |
| MCP Jira indisponível | Perguntar ao usuário o título          |
| Branch já existe      | Confirmar com usuário se reusa         |
| Test plan genérico    | Reescreve específico antes de abrir PR |

## Checklist final

- [ ] `pr-ready` retornou READY
- [ ] Branch criado com naming por `<KEY>`
- [ ] Commits no branch
- [ ] Diff analisado (categorização para a descrição)
- [ ] Descrição segue template completo
- [ ] Tabelas de arquivos completas
- [ ] PR aberto com title e base corretos (reviewer se informado)
- [ ] URL retornada ao usuário

## Sinais de alerta: PARE

- Vai abrir PR sem `pr-ready` ter retornado READY
- Vai forçar push (proibido pelo hook)
- Descrição genérica em vez de detalhada
- Tabelas de arquivos incompletas

## Racionalizações comuns

| Desculpa                                      | Realidade                                         |
| --------------------------------------------- | ------------------------------------------------- |
| "Test plan 'verificar que tudo funciona'"     | Não. Item por item, testável.                     |
| "Vou abrir o PR e melhoro a descrição depois" | Descrição é o que reviewer lê. Faz direito agora. |
| "Diff de 2000 linhas tudo bem, é refactor"    | Reviewer não consegue. Quebra.                    |
