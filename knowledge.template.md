# Knowledge Base: <Nome do Projeto>

> Template. A `knowledge.md` é a **base de conhecimento do código**, gerada por varredura sistemática
> do código-fonte e mantida ao longo do tempo. Ela compõe: cada vez que o agente entende algo novo do
> sistema, registra aqui, e a próxima sessão não precisa redescobrir.
>
> **Como gerar:** peça ao Claude Code para varrer o repositório (módulos, fluxos, integrações) e
> escrever esta página baseada **exclusivamente no código existente**: pontos em aberto viram
> perguntas ao time, não suposições. Reindexe quando a arquitetura mudar. Potencializa com GitNexus
> (ver `integracoes/gitnexus.md`).

## Visão geral

<O que o sistema é, em 1-2 parágrafos: domínio, usuários, o que entrega. Baseado no código.>

## Arquitetura & stack

<Aplicações/serviços que compõem o sistema, como se comunicam, e a stack de cada um. Inclua um
diagrama textual de alto nível se ajudar.>

```text
<diagrama textual: browser → frontend → backend → DB/cache, etc.>
```

## Módulos / domínios

<Para cada módulo de negócio: o que faz, onde vive no código (`path:linha` quando útil), entidades
principais, e fluxos relevantes.>

## Fronteiras e integrações

<Webhooks, filas, serviços externos, gateways de pagamento, mensageria: quem processa o quê e onde.>

## Convenções não-óbvias e gotchas

<O que o código não conta sozinho: restrições de runtime, pegadinhas de fluxo, armadilhas conhecidas.
As **decisões arquiteturais e o porquê** vão no `MEMORY.md` (log de ADRs): aqui fica só o **mapa do
sistema** e os gotchas. Confirme com o time o que estiver em aberto antes de registrar como verdade.>

## Como manter

- Atualize quando criar/alterar módulo, integração ou fluxo relevante.
- Baseie-se no código, não na memória. Pontos em aberto → pergunte, não suponha.
- Cite caminhos (`src/...:linha`) para ancorar o conhecimento no código real.
