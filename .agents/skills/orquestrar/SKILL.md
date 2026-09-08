---
name: orquestrar
description: Coordene uma demanda de desenvolvimento assistido no Orca: leia o briefing, decida o fatiamento, despache workers em worktrees, conduza review independente e entregue uma ou mais PRs revisáveis. Use quando o trabalho envolver múltiplos agentes, worktrees, PRs encadeadas ou um fluxo explícito de coordenação.
---

# Orquestrar trabalho no Orca

Conduza o trabalho como coordenador. O coordenador decide o plano, distribui fatias, aguarda os
workers e valida as evidências; não escreve código da feature. O fluxo transforma um briefing ou
ticket em uma PR revisável, ou em uma cascata de até três PRs quando o escopo realmente exigir.

## Regras de decisão

- Leia `AGENTS.md`, `CLAUDE.md` e o briefing completo antes de dividir o trabalho.
- Uma PR é o padrão. Fatie só quando houver camadas independentes e cada fatia puder compilar e ser
  revisada sozinha.
- Use no máximo três fatias, cortadas por entrega coerente, não por arquivo.
- Pergunte a base raiz e o fatiamento antes de criar worktree quando essas decisões não estiverem
  explícitas no pedido.
- Não invente regra de negócio. Dúvida vai para o coordenador e, quando necessário, para o usuário.
- Se o runtime do Orca não estiver pronto, pare com o erro exato. Não substitua o Orca por um shell
  Linux com o mesmo nome nem simule uma execução coordenada.

## 1. Preparar a execução

Confirme o runtime e o repositório atual:

```bash
ORCA="${ORCA_CLI_COMMAND:-orca}"
ORCA status --json
git branch --show-current
git fetch origin
```

O status precisa indicar que o runtime está pronto. Confirme também a base, o nome da branch e o
limite de escopo com o usuário quando o briefing não trouxer essas decisões.

## 2. Dividir o trabalho

Produza um plano curto com:

1. objetivo e critério de pronto;
2. uma fatia ou uma cascata de duas ou três fatias;
3. arquivos ou camadas de cada fatia;
4. base de cada branch;
5. validação e revisão esperadas.

Uma divisão válida mantém cada fatia funcional. Não crie um arquivo novo só para justificar uma
fatia e não deixe código sem caller para a PR seguinte.

## 3. Criar worktree e despachar worker

Crie uma fatia por vez. A próxima usa a branch da anterior como base:

```bash
ORCA worktree create --name <work-id> --no-parent --base-branch <base> --json
ORCA terminal create --worktree id:<full-worktree-id> --title <work-id> \
  --command 'codex' --json
ORCA terminal wait --terminal <handle> --for tui-idle --timeout-ms 90000 --json
ORCA orchestration dispatch --task <task-id> --to <handle> --inject --json
```

Envie ao worker um bloco autocontido:

```text
OBJETIVO: <objetivo do briefing>
FATIA: <n> de <total>
BASE: <branch base>
BRANCH: <branch da fatia>
ESCOPO: <o que entra>
FORA DO ESCOPO: <o que fica para outra fatia>

Leia AGENTS.md e CLAUDE.md. Implemente somente esta fatia.
Use o workflow local apropriado e rode `bun run verify` antes de parar.
Dúvida de negócio ou contrato: envie uma pergunta ao coordenador; não adivinhe.
Não abra PR nem faça push. Ao terminar, envie `worker_done` com arquivos alterados,
commit e resultado da validação.
```

Espere pelo sinal do worker usando o fluxo de orquestração. O silêncio de uma janela não prova
travamento: confira a task e o terminal antes de redispatch. Não descarte eventos por um filtro sem
buffer de linha.

## 4. Revisar antes da PR

Para cada grupo de arquivos, crie um reviewer novo e independente do worker. O reviewer deve:

- ler os arquivos completos e o diff contra a base correta;
- aplicar `.claude/docs/guardrails-catalog.md` nas categorias A–G;
- ignorar famílias que `bun run verify` já cobre;
- reportar somente achados concretos em `arquivo:linha`, com cenário e evidência;
- terminar com `VEREDITO: APROVADO` ou `VEREDITO: <n> ACHADOS`.

O coordenador relê cada achado no código real. Feedback é claim, não veredito. Descarte nitpick,
duplicata e problema preexistente não agravado. Se houver achados reais, reengaje o mesmo worker
com o relatório; aceite no máximo duas rodadas de correção. Cada commit novo exige nova revisão.

## 5. Fechar a fatia

Só libere a PR depois de:

1. `bun run verify` verde;
2. revisão independente aprovada;
3. diff dentro do teto do projeto;
4. documentação da decisão e dos arquivos alterados;
5. confirmação de que a branch aponta para a base planejada.

Use `/pr-ready`, `/pre-review` e `/create-pr` conforme os comandos disponíveis no repositório. O
coordenador não ignora hooks, não grava selo para um HEAD que não foi revisado e não faz merge.

## Relatório

Entregue uma tabela curta com fatia, branch, base, arquivos, validação, review e PR. Registre o que
ficou de fora, qualquer bloqueio do Orca e o próximo passo. Se houver cascata, só conclua o fluxo
quando a última PR estiver aberta e todas as bases estiverem explícitas.
