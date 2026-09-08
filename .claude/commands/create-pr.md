---
description: Cria branch e abre PR padronizado via gh com descrição estruturada
argument-hint: <KEY>
---

# Criar PR

Entrada: $ARGUMENTS

Pré-requisitos, nesta ordem:
1. `/pr-ready` — só prosseguir se o veredito foi READY.
2. `/pre-review` — grava o selo `.agents/tmp/pre-review-<HEAD>.ok`. **Sem ele o hook
   `pre-pr-review-gate.ts` bloqueia a abertura do PR**, e commit novo invalida o selo.

Ativa: `pr-creation`.

Executa o fluxo definido em `pr-creation` (coleta → branch → análise de diff → descrição → abrir PR). Confia no veredito READY do `/pr-ready`: não re-roda checks. Não duplicar regras aqui.
