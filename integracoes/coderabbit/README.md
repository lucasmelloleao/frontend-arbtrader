# Integração: CodeRabbit (review de PR por IA)

**O que é:** CodeRabbit (`https://coderabbit.ai`) é um reviewer de pull request por IA. Ao abrir ou
atualizar um PR, ele analisa o diff e posta comentários inline (threads) e um review-resumo com
nitpicks, cada um com severidade e sugestão de fix. É serviço de terceiros: instale pelo GitHub App
oficial. Aqui está como o método o usa.

## Por que entra no método

Review por IA acelera o loop, mas **feedback de IA é claim, não verdade**: o CodeRabbit erra, sugere o
que as nossas regras proíbem (check defensivo, fallback silencioso, abstração especulativa) e comenta
sobre código que já mudou. O método não trata o bot como autoridade: ele entra como uma primeira
passada barata, e o julgamento fica com você. A disciplina é filtrar cada achado em 3 eixos (ainda se
aplica? bate com as nossas regras? está tecnicamente correto?) antes de qualquer coisa entrar no
codebase.

## Como pluga no fluxo

1. **Instale o GitHub App** do CodeRabbit no repo (pela fonte oficial em `https://coderabbit.ai`). A
   partir daí ele roda automático em todo PR: posta threads inline e um review-resumo.
2. **Abriu o PR?** O CodeRabbit revisa em alguns minutos. Quando os comentários chegarem, rode o
   comando `/pr-review <número-do-PR>` (cópia de-brandada em `pr-review.md`, instale como
   `.claude/commands/pr-review.md`). Ele é **phase-aware**:
   - **TRIAR + responder:** puxa os comentários, julga item a item, aplica os aprovados (com sua
     confirmação), commita dividido por domínio e responde cada thread.
   - **RESOLVER:** re-execute mais tarde. O CodeRabbit leva minutos pra reanalisar o commit; nesta
     fase o comando lê a resposta nova dele e resolve as threads que convergiram (com guarda contra
     ping-pong infinito).
   - **AGUARDANDO:** a gente já respondeu e ele ainda não rebateu; o comando diz isso e para.
3. **Dados determinísticos:** `cr-comments.ts` (`bun integracoes/coderabbit/cr-comments.ts <pr>`) faz o
   fetch via GraphQL `reviewThreads` e normaliza os comentários (tira o markdown de ruído, extrai
   título e severidade, marca `isResolved`/`isOutdated`). O LLM gasta token julgando, não paginando o
   GitHub. É a fonte única porque só o GraphQL dá, por thread, o estado de resolução + o node id (pra
   resolver) + o `databaseId` (pra responder via REST `in_reply_to`).
4. **O julgamento é conduzido pela skill `pr-review-response`** (já no kit): ela define as 4 fases
   (contexto/checkout, coleta, classificação FIX/JUSTIFY/PARTIAL, aplicar, responder) e exige
   autorização explícita entre cada passo crítico. O comando `/pr-review` é a porta de entrada; a skill
   é o método.

## A disciplina (o que o método exige)

- **Nada entra sem passar pelo seu julgamento.** Leia o código real no HEAD atual, não confie na linha
  do comentário (ela envelhece).
- **Cruze com `AGENTS.md` / `CODE-PATTERN.md`.** Se o CodeRabbit sugere o que a gente proíbe, o veredito
  é pular, citando a regra. Um "pular" bem justificado vale mais que aplicar tudo.
- **Prove antes de aplicar** quando o achado for técnico (teste rápido). O bot alucina.
- **Ao responder:** comece com `@coderabbitai`, diga o que foi feito ou por que pulou, e peça
  verificação cética da solução commitada. Postar é irreversível: mostre os drafts e espere o OK.

## Sem CodeRabbit

O método não depende dele: a skill `pr-review-response` e o comando de review funcionam com qualquer
reviewer (inclusive humano), e o `feature-audit` cobre a validação local antes do PR. O CodeRabbit só
adiciona uma primeira passada automática; o filtro de 3 eixos continua sendo o que protege o codebase.
