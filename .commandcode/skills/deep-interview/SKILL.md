---
name: deep-interview
description: "Use quando os requisitos estiverem ambíguos, quando o usuário disser 'interview', 'entrevista', 'discovery', 'levantamento', 'depende', 'acho que', 'mais ou menos', ou antes de qualquer feature complexa em que as regras de negócio não estão totalmente especificadas. Sintomas: descrição vaga no Jira, usuário largou uma frase única, edge cases obscuros, requisitos conflitantes, comportamento de lifecycle do app não especificado."
---

# Deep Technical Interview

## Visão geral

Entrevista estruturada para descobrir requisitos escondidos, trade-offs, riscos e decisões arquiteturais ANTES de implementar. Substitui prompt longo+genérico por descoberta dirigida em 5 fases. Em plan mode, **toda** pergunta vai via `AskUserQuestion`.

## Quando usar

- Antes de feature complexa
- Requirements ambíguos
- Usuário pediu "entrevista", "discovery", "interview"
- Resposta vaga ("acho que", "depende")
- Decisão arquitetural precisa ser registrada
- Ativada por `workflow-new-feature` Phase 0 ou `workflow-refactor` quando há ambiguidade

## Quando NÃO usar

- Requisito claro e auto-contido (1-2 linhas + acceptance criteria + spec da API)
- Bug óbvio (corrija direto ou use sua skill de debugging)
- Já fez a entrevista nessa sessão e tem o relatório

## Princípios da entrevista

### Profundidade > amplitude

- Cada resposta do usuário gera follow-up antes de avançar de área
- Não aceita resposta superficial: pede exemplo concreto
- Cada área esgota antes de pular

### Perguntas não-óbvias

**Proibidas (já estão no CLAUDE.md / skills):**

- "Qual framework?" / "Qual linguagem?" / "Vai ter testes?" / "Vai usar TypeScript?"

**Esperadas (revelam complexidade escondida):**

- "O que acontece se o usuário tentar X enquanto Y está em progresso?"
- "Esse dado pode mudar entre o usuário ver e clicar enviar?"
- "Se o backend retornar Z inesperado, como o app se comporta?"
- "Dois usuários podem entrar em conflito nessa operação?"
- "Volume esperado? Muda a abordagem de paginação/virtualização?"
- "Esse estado precisa sobreviver reload da página ou navegação?"
- "Se a API leva 30s, o que o usuário vê?"
- "Esse fluxo pode ser interrompido (navegação, reload)? Dado parcial fica como?"
- "Como se comporta em conexão ruim/lenta?"

## Integração com plan mode

Em plan mode:

- **TODA** pergunta vai via `AskUserQuestion`
- 1 pergunta por chamada (no máximo 2 se diretamente relacionadas)
- Aguarda resposta antes de prosseguir
- Follow-ups via `AskUserQuestion` também

## Fases

### Fase 0: exploração do codebase (gate obrigatório)

Antes de qualquer pergunta:

1. Ler arquivos relevantes (feature code, types, API layer, testes existentes)
2. Ler CLAUDE.md + skills referenciadas
3. Construir modelo mental do estado atual
4. **Pular perguntas cuja resposta está no código**
5. Usar contexto descoberto para perguntar com precisão

Objetivo: chegar na Phase 1 já informado, só perguntando o que exige conhecimento humano.

### Fase 1: Contexto & Escopo

- Que problema de negócio resolve?
- Quem é o usuário final, qual o fluxo esperado?
- Quais limites do escopo (o que NÃO é parte)?
- Há dependência de backend/API ainda não pronta?

### Fase 2: Fluxo & Estados

- Todos os estados de UI (loading, empty, error, success, partial)
- Fluxos alternativos e edge cases
- Transições entre estados
- O que acontece em falha parcial
- Race conditions e concorrência
- Interrupções (reload da página, navegação)

### Fase 3: Dados & Integração

- Shape do dado vindo da API (referenciar o spec da API quando aplicável: vide `api-contract`)
- Transformações necessárias entre API e UI
- Revalidação após mutação (`revalidatePath`/`router.refresh`): sem cache de página (ver doutrina)
- Pagination, filters, sorting (estado na URL)
- Múltiplas fontes (fetches paralelos via `Promise.all`)
- Auth/sessão: cookie JWT same-site é do backend (ver `api-contract`)

### Fase 4: UX & Comportamento

- Feedback visual esperado por ação
- Como erro aparece pro usuário
- Acessibilidade (teclado, leitor de tela, foco visível)
- Comportamento em conexão ruim/lenta
- Microinterações e estados de hover/focus
- Deep linking, restauração de estado
- Responsividade (mobile e desktop), breakpoints

### Fase 5: Restrições & Riscos

- Constraints técnicos conhecidos
- Risco de performance (render de lista grande, computação pesada no client, imagem grande)
- Dependência externa e SLAs
- Complexidade estimada × deadline
- O que pode dar errado e mitigação
- Compatibilidade de browsers e telas variadas

## Regras de condução

1. UMA pergunta por vez (duas se diretamente relacionadas)
2. Decidir após cada resposta: follow-up na mesma área OU avançar
3. Não encerrar prematuro: cobrir as 5 fases
4. Resposta vaga → reformular com mais especificidade
5. "Não sei" → registrar como **risco/assumption a validar**
6. Manter registro mental de cada decisão

## Saída

Ao concluir, gerar:

```
# Technical Interview Summary: <TOPIC>

## Decisões confirmadas
- [Decisões com justificativa]

## Requisitos descobertos
- [Surgidos na entrevista]

## Restrições identificadas
- [Técnicas, negócio, deadline]

## Riscos e premissas
- [Assumptions a validar]

## Edge cases mapeados
- [Não-óbvios]

## Próximos passos
- [O que fazer com o material]
```

## Sinais de entrevista completa

- Todas as 5 fases cobertas
- Sem ambiguidade relevante restante
- Usuário confirma que não há mais pontos
- Decisões suficientes pra iniciar plan de implementação

## Sinais de alerta: PARE

- Pular Phase 0 e começar a perguntar: sempre lê o código primeiro
- Aceitar "depende" sem follow-up
- Pular pra implementação antes da Phase 5
- Perguntar em texto livre quando deveria ser `AskUserQuestion` (plan mode)

## Racionalizações comuns

| Desculpa                                             | Realidade                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| "O requisito tá claro, pula entrevista"              | "Claro" pra você. Tem edge case que ninguém pensou ainda.   |
| "Já sei o backend, não preciso ler o spec"             | Backend muda. Lê.                                           |
| "Vou perguntar tudo de uma vez pra economizar tempo" | Pergunta combinada = resposta superficial. Uma de cada vez. |
