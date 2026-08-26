---
name: pr-ready
description: "Use quando estiver prestes a abrir um PR, quando o usuário disser 'pr ready', 'tá pronto pra subir', 'posso abrir o PR', ou após terminar um workflow de feature/refactor/expand e antes de invocar `pr-creation`. Sintomas: arquivos modificados sem rodar lint/typecheck/test, diff > 1500 linhas, arquivos novos sem JSDoc, prints/console.log esquecidos."
---

# PR Ready

## Visão geral

Gate antes de abrir PR. 9 verificações concretas: passa todas ou não abre o PR.

> Base branch = a definida na seção *Branch base* do `CLAUDE.md` (default `main`). Os comandos abaixo (checks #5/#6 e Verificação) usam `main` como exemplo: substitua pela base configurada se o time usa outro fluxo (gitflow etc.).

## Quando usar

- Sempre antes de `/create-pr`
- Quando o usuário pede "checa se tá pronto"
- Ao finalizar `workflow-refactor`, `workflow-new-feature`, `workflow-feature-expansion`

## Quando NÃO usar

- Durante implementação ("ainda estou codando"): espera terminar
- Para WIP commits intermediários
- Para hotfix com aprovação explícita de pular gate

## Regras centrais: as 9 verificações

| #   | Check              | Comando                                                    | Pass se                                                 |
| --- | ------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Lint               | `bun run lint`                                             | exit 0                                                  |
| 2   | Type check         | `bun run typecheck`                                        | exit 0                                                  |
| 3   | Testes             | `bun test`                                                 | exit 0                                                  |
| 4   | Unused exports cross-module | manual (lint não pega cross-module)               | sem export que nenhum outro módulo consome              |
| 5   | Diff scope         | `git diff main --numstat`                                  | ≤ 1500 linhas; **> 1500 = HARD FAIL (NOT READY)**       |
| 6   | Secrets            | `git diff main`                                            | sem `.env`, sem token hardcoded, sem `credentials.json` |
| 7   | JSDoc coverage     | manual: novos exports têm JSDoc                            | 100% das funções/hooks exportados                       |
| 8   | Naming compliance  | invocar `naming-conventions`                               | sem violações                                           |
| 9   | Contract alignment | invocar `api-contract` se schemas/contratos tocados   | spec espelhado 1:1, sem drift                                |

## Referência rápida: Saída esperada

```
# PR Ready Check

| # | Check          | Status              |
|---|----------------|---------------------|
| 1 | Lint           | ✅                  |
| 2 | Type check     | ✅                  |
| 3 | Testes         | ✅                  |
| 4 | Unused exports | ⚠️ 2 cross-module   |
| 5 | Diff scope     | ✅ 432 linhas       |
| 6 | Secrets        | ✅                  |
| 7 | JSDoc          | ⚠️ 1 hook sem JSDoc |
| 8 | Naming         | ✅                  |
| 9 | Contract       | ✅                  |

Verdict: NOT READY (fix #4 e #7 antes de abrir PR)
```

## Sinais de alerta: PARE

- Skipping `bun test` "porque é só CSS" (lint pega isso, mas teste prova)
- Diff > 1500 linhas com argumento "é tudo relacionado": quebra em PRs menores
- Achar que `.env.local` é seguro commitar "só pra dev"
- JSDoc faltando em hook novo
- Ignorar `no-unused-vars` do oxlint "porque vai usar depois" (YAGNI viola)

## Racionalizações comuns

| Desculpa                                   | Realidade                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| "Lint já rodou local, pula"                | Rodar de novo é grátis. Drift entre local e CI acontece.                                  |
| "Diff grande porque é refactor"            | Refactor grande = PRs menores em ordem. Reviewer humano não consegue revisar 3000 linhas. |
| "`no-unused-vars` não importa, é teste"    | Dead code em teste vira mock errado. Resolve.                                             |
| "JSDoc é só formalidade"                   | JSDoc é o contrato de API da função. Sem ele, o próximo dev recria a função.              |
| "Vou abrir o PR e arrumo depois no review" | Reviewer humano custa caro. CI é grátis. Resolve antes.                                   |

## Verificação (meta: confere que a própria skill foi seguida)

Antes de declarar PR Ready, comprove:

```bash
bun run lint && \
bun run typecheck && \
bun test && \
git diff main --numstat | awk '{add += $1; del += $2} END {if (add + del > 1500) exit 1}' && \
! git diff main | grep -qE "(\.env\.local|password.*=.*['\"]\w+|api[_-]?key.*=.*['\"]\w+)" && \
echo "READY"
```

Se o output não termina com `READY` → não é ready.

## Integração

Cadeia até o PR: **`/pr-ready` → `/pre-review` → `/create-pr`.**

- Esta skill é o gate **mecânico**: o que uma máquina prova (lint, typecheck, testes, tamanho do diff, secrets, JSDoc, naming, contrato).
- `pre-review` é o **julgamento**: over-engineering, fallback defensivo, regra de negócio inventada no front, slop. Nada que um gate automático pegue. Ela grava o selo `.agents/tmp/pre-review-<HEAD>.ok`.
- Sem esse selo, o hook `pre-pr-review-gate.ts` **bloqueia** a abertura do PR.

Não duplicar checks entre as três: cada uma cobre o que as outras não cobrem.

> Os checks #1–#3 desta skill são um subconjunto de `bun run verify`. Se preferir, rode o gate canônico de uma vez (`bun run verify`) e use a tabela abaixo só para os checks #4–#9, que o `verify` não cobre.
