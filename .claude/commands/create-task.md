---
description: Cria task padronizada no seu issue tracker com entrevista e template estruturado
argument-hint: descrição da task
---

# Criar Task

Entrada: $ARGUMENTS

Ativa: `task-creation`, `deep-interview`.

Antes de criar, explorar o codebase para entender módulos afetados e padrões. Se houver ambiguidade no input → ativar `deep-interview`.

Executa o workflow definido em `task-creation` (template + bloco "🤖 Instruções para agente" obrigatório no final). Não duplicar regras aqui.
