---
name: task-creation
description: "Use quando o usuário quiser criar task / story / bug no issue tracker (Jira, Linear, GitHub Issues...), digitar 'criar task', 'create task', 'abrir task', 'nova issue', ou passar uma descrição de feature que precise virar issue rastreável. Sintomas: descrição informal precisa virar critério de aceite verificável, naming de branch precisa ser definido, instrução para agente precisa entrar na task."
---

# Task Creation

## Visão geral

Cria task padronizada no seu issue tracker (Jira, Linear, GitHub Issues, ou um arquivo de task), com critérios de aceite verificáveis, contexto claro e bloco obrigatório de "Instruções para agente". O texto da task **não inclui código de implementação**.

> Se o tracker tem MCP/CLI disponível, crie a issue por ele; senão, gere o texto pronto para colar.

## Quando usar

- Criar task, story ou bug no tracker
- Demanda informal precisa virar issue rastreável
- Antes de começar feature/refactor que vai pra board

## Quando NÃO usar

- Já existe issue/key: vá para `workflow-new-feature` / `workflow-refactor`
- Task interna do agente (use a lista de tarefas do próprio agente, não o tracker)

## Regras obrigatórias

- **Sem código** no texto da task. Payload/JSON/comando de terminal pode entrar **se** ajuda execução.
- Títulos de seção com emoji (padrão visual).
- Não remover blocos estruturais do modelo.
- Critérios de aceite verificáveis (testáveis), orientados a resultado.
- Contexto suficiente para execução sem ambiguidade.
- Sempre adicionar ao final o bloco "🤖 Instruções para agente" exatamente como definido abaixo.
- Se houver dúvida relevante, **NÃO assumir**: ativar `deep-interview` antes de criar.

## Template

```text
**🔹 Título**
[Módulo] Descrição curta do que será feito

**🔸 Descrição**

**🎯 Objetivo**
Descrever problema/oportunidade e resultado esperado.

**📌 Contexto**
Origem da demanda, links, restrições de negócio.

**✅ Critérios de Aceite**
- [ ] Critério 1 verificável
- [ ] Critério 2 verificável
- [ ] Critério 3 verificável

**🪲 Se for bug**

**🔁 Etapas para Reproduzir**
1. Passo 1
2. Passo 2
3. Passo 3

**🎯 Comportamento Esperado**
Comportamento correto, claro.

**🔧 Detalhes Técnicos (opcional)**
Impacto técnico, módulos afetados, decisões: sem código.

**🔗 Dependências Externas (opcional)**
Outras tasks, times, APIs, bloqueios.

**🗒️ Notas Adicionais (opcional)**
Alinhamentos, observações.

**🤖 Instruções para agente**
- Planejar seguindo `core-principles` (YAGNI/KISS); evitar over-engineering.
- Sem fallbacks salvo orientação explícita.
- Antes de tocar schema/types/chamada de API, ativar `api-contract` e ler o spec na fonte de contrato.
- Aplicar `layer-boundaries` e `no-barrel-policy` desde o primeiro arquivo.
- Ativar skills relevantes do ambiente para a task antes de codar.
- Em dúvida, NÃO assumir: usar `deep-interview` (`AskUserQuestion` em plan mode).
- Branch: criar com `git checkout -b` usando o tipo correto: `feature/<KEY>`, `bugfix/<KEY>` ou `refactor/<KEY>`.
- Código production-level, senior-ready, com JSDoc completo em exports.
```

## Checklist de qualidade antes de enviar

- [ ] Sem código de implementação no texto
- [ ] Payload/JSON/comando incluídos só quando agregam clareza
- [ ] Objetivo claro, ligado ao resultado
- [ ] Critérios testáveis
- [ ] Contexto permite execução sem dúvida principal
- [ ] Bloco "🤖 Instruções para agente" presente no final, sem alteração
- [ ] Orientação explícita de usar `deep-interview` em caso de dúvida
- [ ] Branch type inferido do tipo da task

## Referência rápida

`<KEY>` = a chave da issue no seu tracker (ex.: `PROJ-123`, `#42`).

A convenção de branch (`feature/`, `bugfix/`, `refactor/`, `hotfix/`, `chore/` + `<KEY>`) é **dona de `pr-creation`**, que cria a branch de fato. Aqui basta inferir o tipo da task.

## Sinais de alerta: PARE

- Tentação de "explicar como implementar" no texto da task
- Critérios de aceite genéricos ("funciona bem", "rápido", "intuitivo")
- Falta de contexto (cair na bancada do dev sem saber por quê)
- Esquecer o bloco final de instruções pra agente

## Racionalizações comuns

| Desculpa                                          | Realidade                                            |
| ------------------------------------------------- | ---------------------------------------------------- |
| "Coloco um snippet de código rápido pra ajudar"   | Não. Code vive no PR. Task descreve o quê e por quê. |
| "Critério de aceite 'funcionar bem' é suficiente" | Não. Tem que dar pra testar binariamente.            |
| "Não preciso do bloco de instruções, é óbvio"     | Não óbvio pra próximo agente. Inclui sempre.         |
