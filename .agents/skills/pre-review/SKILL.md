---
name: pre-review
description: Revisa os guardrails da branch contra a base antes de abrir um pull request.
---

# Pré-review de guardrails

Revise a branch atual contra a base informada pelo usuário, procurando violações
de julgamento que lint, Knip e testes não detectam. Esta skill é o portão do
`gh pr create`: `pre-pr-review-gate.ts` exige o selo do HEAD atual.

O objetivo é simplificar e seniorizar a mudança. Leia os arquivos reais, não
apenas as linhas do diff. Um `?? 0`, uma abstração prematura ou um fallback só
podem ser julgados com o contexto completo.

Esta skill roda no contexto principal para confirmar decisões com o usuário. Para
isolar o julgamento, lance um subagente novo por domínio independente. Releia e
revalide cada achado antes de gravar selo ou ack.

## Catálogo

Leia `.claude/docs/guardrails-catalog.md` antes de distribuir os reviewers. Ele é
a fonte única das categorias A–G e das permissões. Esta skill define o fluxo da
pré-review e o formato da saída; não replique o catálogo aqui.

## 0. Escopo

Substitua `<base>` pela base informada pelo usuário, ou pela seção *Branch base*
do `CLAUDE.md` quando o argumento estiver vazio.

```bash
git fetch origin <base> --quiet
git diff --stat origin/<base>...HEAD
```

Liste os arquivos alterados e agrupe por domínio coeso. Se a mudança altera
assinatura, retorno ou contrato, procure todos os callers, inclusive fora do
diff.

## 1. Revisar por domínio

Para cada domínio independente, lance um reviewer novo. Rode os reviewers em
paralelo quando possível. Cada reviewer recebe o catálogo, o foco do domínio e
a ordem de ler os arquivos completos.

Cada achado precisa conter:

- `arquivo:linha`;
- categoria A–G;
- cenário concreto;
- evidência no código;
- correção recomendada.

Não re-revise famílias que o `verify` já cobre: direção de camadas, barrels,
cache proibido, fetch em effect, localização de `valibot` e `ky`, acesso ao
backend fora do `apiClient`, JWT, `document.cookie`, assertions proibidas,
código morto, runtime Node e type-check.

## 2. Revalidar no contexto principal

Feedback de reviewer é uma alegação, não um veredito. Para cada achado, releia o
arquivo real e descarte nitpick, permissão explícita, fallback necessário e
abstração que já tem os usos exigidos. Mantenha apenas o que você consegue
defender com o código aberto.

## 3. Relatório

Apresente um placar no topo e agrupe achados por categoria e severidade. Liste
também os achados descartados, com o motivo da rejeição, e termine com a ordem de
ataque.

## 4. Selo vinculado ao HEAD

Depois do relatório, peça confirmação ao usuário antes de liberar a PR. Mesmo
sem achados altos, informe claramente que gravará o selo. Só grave após a
confirmação:

```bash
mkdir -p .agents/tmp
git rev-parse HEAD > .agents/tmp/pre-review-$(git rev-parse HEAD).ok
```

O selo vale apenas para esse HEAD. Um commit novo exige outra pré-review. Com
violação alta em aberto, não grave sem liberação explícita.

## 5. Portão de 3000 LOC

Cheque adições e remoções contra a base:

```bash
git diff --numstat origin/<base>...HEAD | awk -F'\t' '$1!="-" {s+=$1+$2} END {print s}'
```

Acima de 3000 LOC, não grave o ack automaticamente. Pergunte se o usuário
prefere dividir por domínio ou seguir por ser uma unidade coesa indivisível.
Após confirmação, o ack fica vinculado ao HEAD:

```bash
git rev-parse HEAD > .agents/tmp/pr-size-ack-$(git rev-parse HEAD).ok
```

## Relação com `pr-ready`

`pr-ready` é o gate mecânico: lint, typecheck, testes, tamanho do diff, secrets,
JSDoc, naming e contrato. Esta skill é o julgamento que nenhum gate automático
pega. A cadeia é `/pr-ready` → `/pre-review` → `/create-pr`.
