---
description: Processa o review do CodeRabbit num PR (triar, responder, resolver) guiado e phase-aware
argument-hint: "[número-do-PR]"
allowed-tools: Bash(bun integracoes/coderabbit/cr-comments.ts:*), Bash(gh:*), Bash(git:*), Bash(bun run:*), Bash(bun test:*), Read, Edit, Write, Grep, Glob, AskUserQuestion
---

Você vai processar o review do CodeRabbit no PR de ponta a ponta, com filtro racional e passo a passo. Feedback de IA é **claim, não verdade**: o CodeRabbit erra, sugere o que as nossas regras proíbem, e comenta sobre código que já mudou. Nada entra no codebase sem passar pelo seu julgamento.

Este comando é **phase-aware** e roda em momentos diferentes do ciclo. O CodeRabbit leva minutos pra reanalisar um commit, então a fase de resolver é uma re-execução, não um passo bloqueante.

PR alvo: `$ARGUMENTS` (vazio = PR da branch atual). Base assumida: `main`.

## 0. Puxar e detectar a fase

Rode o fetch e trabalhe SÓ com o JSON que ele devolve:

```
bun integracoes/coderabbit/cr-comments.ts $ARGUMENTS
```

Leia o bilhete `.claude/tmp/cr-<PR>.json` (se existir). Cruze com as `threads` e decida a fase, **anuncie qual detectou e confirme com o usuário antes de agir**:

- **TRIAR**: há threads abertas (`isResolved: false`) ainda sem decisão no bilhete. É o caso inicial.
- **RESOLVER**: todas as decididas estão `replied: true` E o CodeRabbit respondeu depois da nossa réplica (a última fala de `replies` é dele). Pula pra seção "Fase RESOLVER".
- **AGUARDANDO**: a gente já respondeu mas o CodeRabbit ainda não rebateu (a última fala é nossa). Diga isso e pare; não invente resposta dele.

Ignore threads já `isResolved`. Trate `isOutdated` com cuidado: o comentário pode ser sobre código que já mudou. Analise também `reviewSummaries` (nitpicks colapsados no corpo) na fase de triar, mesmo sem thread própria.

---

## Fase TRIAR (+ responder)

### 1. Julgar cada item em 3 eixos (nesta ordem)

Para CADA comentário/nitpick, leia o **código real no HEAD atual** (não confie na linha do comentário, ela envelhece) e decida:

1. **Ainda se aplica?** Se o ponto já não existe no código, descarte.
2. **Bate com as nossas regras?** Cruze com `AGENTS.md` / `CODE-PATTERN.md`. O CodeRabbit às vezes sugere o que a gente **proíbe**: check defensivo, fallback `?? ''`, abstração especulativa, wrapper que só repassa, validação de regra de negócio (isso é do backend). Se contradiz uma regra nossa, o veredito é pular, citando a regra.
3. **Está correto?** O CodeRabbit alucina. Verifique o mérito técnico contra o código, não contra a autoridade do bot. Quando der, **prove** (teste rápido) antes de aplicar.

### 2. Apresentar e decidir (passo a passo)

Mostre um resumo no topo e, por item: **arquivo:linha**, o ponto do CodeRabbit (1 linha), **prós**, **contras**, **edge cases**, e seu **veredito** recomendado.

Depois colha a decisão com **AskUserQuestion**, uma pergunta por comentário (aplicar / pular / parcial), com seu veredito como opção recomendada. Se houver mais de ~4 comentários, faça em lotes ou ofereça uma pergunta única "aprovar todos os recomendados / revisar um a um". Seja honesto: um "pular" bem justificado vale mais que aplicar tudo.

### 3. Aplicar os aprovados

1. Aplique seguindo os patterns do repo (a fix do CodeRabbit é ponto de partida, não evangelho).
2. Rode o gate local completo: `bun run lint && bun run typecheck && bun run typecheck:tooling && bun test`. Só siga se passar.
3. Commite **dividido por domínio**, a mensagem referencia o achado do CodeRabbit. Confirme com o usuário e `git push`.

### 4. Responder as threads

Redija, por thread inline decidida, um texto que SEMPRE:
- Começa com `@coderabbitai`.
- **Aplicado:** o que foi feito + commit (sha curto). **Pulado:** justifica citando a regra nossa / código já cobre / contradiz a arquitetura.
- Fecha pedindo verificação cética: "não confie cego na solução; reanalisa o que foi commitado e me diz se introduziu bug ou edge case novo."

Tom PT-BR, direto, sem travessão, human-like. Os nitpicks do corpo não são thread respondível: agrupe num reply-resumo só, se valer.

**Mostre todos os drafts e espere o OK explícito** (postar é irreversível). Depois poste cada um na própria thread:

```
gh api repos/{owner}/{repo}/pulls/<PR>/comments -f body="<texto>" -F in_reply_to=<commentId>
```

### 5. Bilhete

Grave/atualize `.claude/tmp/cr-<PR>.json` (crie a pasta se faltar): por item `{ commentId, threadId, path, line, verdict, replied, summary, commit }`. No fim, diga que o CodeRabbit vai levar alguns minutos pra reanalisar, e que **rodar `/pr-review` de novo mais tarde** fecha o loop (fase RESOLVER).

---

## Fase RESOLVER

### 1. Classificar e julgar cada thread respondida

Para cada thread com resposta nova do CodeRabbit, classifique e julgue nos mesmos 3 eixos (a re-análise dele também é claim):

- **Convergiu:** confirmou a fix ou aceitou a justificativa. Nada além de resolver.
- **Achou algo real:** pegou um bug ou edge case verdadeiro na nossa fix commitada. Vira item novo.
- **Insistindo errado / alucinando de novo:** re-afirma sem fato novo, ou inventa.

### 2. Guarda de convergência (importante)

Não pode virar ping-pong infinito. Se uma thread **já passou por um ciclo** (respondemos, ele rebateu) e ele **não traz fato técnico novo**, o veredito padrão é **encerrar** com justificativa final, nunca reabrir. Só "achou algo real" justifica nova rodada.

### 3. Propor e agir (com confirmação)

Apresente o estado de convergência e proponha por thread: **resolver** / **nova rodada** / **escalar pro humano**. Resolver é outward-facing: liste as que vão ser resolvidas, espere o OK, depois:

```
gh api graphql -f query='mutation($id:ID!){ resolveReviewThread(input:{threadId:$id}){ thread { isResolved } } }' -F id=<threadId>
```

Se houver "achou algo real", não conserte aqui: aponte os itens e volte pra fase TRIAR só nesses (re-execução do fluxo completo, com o filtro de 3 eixos). Atualize o bilhete com o estado final de cada thread.
