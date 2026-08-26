# Integração: impeccable (design de frontend)

**O que é:** `impeccable` (de Paul Bakaus: `github.com/pbakaus/impeccable`, Apache-2.0) é uma skill de
design para agentes de código: **1 skill com 23 comandos** sob `/impeccable` (`polish`, `audit`,
`critique`, `distill`, `animate`, `bolder`, `quieter`…) + um **CLI detector** com 41 regras
determinísticas de "AI slop" (sem LLM, sem API key). É de terceiros: instale pela fonte oficial.
Aqui está como o método o usa.

## Por que entra no método

A IA, por padrão, produz UI "genérica/templated" (Inter em tudo, gradiente roxo→azul, card dentro de
card, texto cinza sobre cor). O `impeccable` empurra a interface para algo **intencional e distinto** e
é o motor por trás do artefato **`DESIGN.md`**: o sistema visual (tokens) vive no `DESIGN.md`, e o
`impeccable` o cria, mantém e aplica aos componentes. É o complemento humano do oxlint: onde o lint
garante *correção*, o impeccable garante *intenção visual*.

## Setup (passo a passo)

1. **Instale a skill** (na raiz do projeto): auto-detecta o harness e escreve em `.claude/skills/`:
   ```bash
   npx impeccable skills install
   ```
   Alternativa Claude Code (plugin): `/plugin marketplace add pbakaus/impeccable` e depois `/plugin install impeccable`.
   Recarregue o Claude Code depois.
2. **Rode o `init`** (uma vez) para gerar o contexto de design:
   ```
   /impeccable init
   ```
   Ele pergunta se a superfície é **brand** (marketing/landing) ou **product** (app/dashboard) e
   escreve `PRODUCT.md` + `DESIGN.md`. Este boilerplate já traz `PRODUCT.md`/`DESIGN.md` como template
  : deixe o `init` preenchê-los, ou use `/impeccable document` para gerar o `DESIGN.md` a partir do
   código existente.
3. No `CLAUDE.md`, registre que o sistema visual normativo está em `DESIGN.md` e que trabalho de design
   passa pelo `/impeccable` (bloco abaixo).

## A disciplina (o que o método exige)

- **`DESIGN.md` é a fonte da verdade visual**: tokens (cores/tipografia/espaçamento) em frontmatter.
  Código consome dos tokens, nunca valores mágicos (ecoa o `design-system`).
- **Construiu/ajustou UI?** Rode `/impeccable critique <alvo>` (review de UX: hierarquia, clareza) e
  `/impeccable polish <alvo>` (passada final + alinhamento ao design system) antes de considerar pronto.
- **Decisões visuais novas voltam para o `DESIGN.md`**: ele co-evolui com a UI.
- **Comando certo para a intenção:** `bolder`/`quieter` (intensidade), `distill` (essência),
  `animate` (motion), `harden` (overflow/i18n/edge cases), `onboard` (empty states), `clarify` (copy),
  `layout`/`typeset`/`colorize` (cirúrgicos). `/impeccable` sozinho lista todos. `/impeccable pin audit`
  cria o atalho `/audit`.
- **Gate determinístico (opcional, sem API key):** `npx impeccable detect src/` pega 41 issues de slop/
  qualidade sem LLM. É ferramenta de dev (como o binário do oxlint): pode rodar ad hoc ou no CI ao
  lado do `bun run lint`. Use `--fast --json` para saída programática.

## Bloco para o seu `CLAUDE.md`

```markdown
<!-- impeccable:start -->
## Design: impeccable

O sistema visual normativo deste projeto vive em `DESIGN.md` (tokens = fonte da verdade; sem
cores/tamanhos mágicos no código). Trabalho de design passa pelo `/impeccable`.

- Ao criar/alterar UI, rode `/impeccable critique <alvo>` e `/impeccable polish <alvo>` antes de concluir.
- Decisões visuais novas voltam para o `DESIGN.md`: ele co-evolui com a UI.
- `/impeccable init` (uma vez) preenche `PRODUCT.md`/`DESIGN.md`; `/impeccable document` gera o
  `DESIGN.md` a partir do código.
- Anti-slop: nada de Inter/Arial por padrão, gradiente roxo→azul, card-dentro-de-card, texto cinza
  sobre cor, preto/cinza puro (sempre tinja), easing bounce/elastic.
<!-- impeccable:end -->
```

## Sem impeccable

O `DESIGN.md` sozinho já dá disciplina visual (tokens centrais, sem valores mágicos) e a skill
`design-system` cobre os princípios. O `impeccable` apenas potencializa criação e auditoria: o método
não depende dele para funcionar.
