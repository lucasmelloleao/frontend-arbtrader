---
name: pr-review-response
description: "Use quando o usuário compartilhar uma URL de PR e pedir para responder comentários de review, digitar 'review PR', 'responder PR', 'PR comments', 'coderabbit', 'review response'. Sintomas: PR aberto com comentários pendentes do CodeRabbit ou humano, precisa classificar FIX/JUSTIFY/PARTIAL, aplicar correções e responder."
---

# PR Review Response

## Visão geral

Ciclo completo de resposta a review comments (CodeRabbit ou humano): analisar cada comment, classificar (FIX / JUSTIFY / PARTIAL), aplicar fixes, validar (lint + typecheck), aguardar commit+push do usuário, responder via GH API com autorização explícita.

## Quando usar

- PR com comentários pendentes
- Usuário compartilha URL do PR pedindo resposta aos reviews

## Quando NÃO usar

- Implementação ainda em curso (não tem PR aberto)
- Comments já respondidos

## Fase 0: contexto & checkout

1. Extrair owner/repo/PR# da URL.
2. `gh pr checkout <number>` para o branch do PR.
3. `gh pr view <number> --json title,body,headRefName,baseRefName`
4. Identificar reviewer principal (CodeRabbit, humano, ambos).

## Fase 1: coleta de comentários

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate
gh api repos/{owner}/{repo}/pulls/{number}/reviews --paginate
```

- Agrupar por arquivo/linha
- Ignorar já respondidos pelo PR author (`user.login`)
- Separar pendentes × resolvidos

## Fase 2: análise & plano

Para cada comment pendente:

1. Ler o arquivo + contexto ao redor da linha
2. Entender codebase relevante (imports, types, hooks, schemas, estilos, etc.)
3. **Classificar:**
   - **FIX**: problema real, corrige
   - **JUSTIFY**: comment válido mas implementação atual está certa por motivo específico
   - **PARTIAL**: parte aplica, parte justifica
4. Para FIX: descrever o fix planejado
5. Para JUSTIFY: preparar justificativa técnica

Saída obrigatória desta fase:

| Comment (resumo) | Arquivo | Classificação | Ação planejada |
| ---------------- | ------- | ------------- | -------------- |

**Aguardar aprovação do usuário antes de executar.**

## Fase 3: aplicar fixes

1. Aplicar cada FIX/PARTIAL.
2. Manter compliance com `layer-boundaries`, `no-barrel-policy`, `naming-conventions`, `typescript-strict`, `nextjs-react19-architecture`, `core-principles`.
3. Se tocou schema/types/contrato → ativar `api-contract`.
4. Rodar `bun run lint && bun run typecheck && bun test` após fixes (mesmo gate do `pr-ready`).
5. Apresentar diff resumido ao usuário.
6. **Aguardar usuário commitar e pushar.**

## Fase 4: responder via GH API

Após confirmação de commit/push:

1. Pedir autorização explícita pra responder.
2. Para cada comment:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies \
  -f body="<resposta>"
```

**Formato das respostas:**

**FIX:**

```
@coderabbitai Corrigido conforme sugerido.
[Descrição breve do que foi alterado]

Poderia re-analisar esta mudança?
```

**JUSTIFY:**

```
@coderabbitai Mantido intencionalmente.
[Justificativa técnica clara: citar skill/CLAUDE.md quando aplicável]
```

**PARTIAL:**

```
@coderabbitai Parcialmente aplicado.
[O que foi corrigido]
[O que foi mantido e por quê]
```

Se reviewer for humano → tirar `@coderabbitai` e ajustar tom.

## Regras obrigatórias

- Nunca responder sem aprovação do usuário
- Nunca push automático: usuário controla
- Sempre ler o código antes de classificar (nunca só pelo texto do comment)
- Se comment menciona pattern do projeto, verificar se o pattern de fato existe
- Respostas concisas, técnicas, não-defensivas
- Em dúvida sobre comment → perguntar ao usuário antes de classificar

## Referência rápida

| Comment dizer X                         | Classificação típica               |
| --------------------------------------- | ---------------------------------- |
| "Extraia esse componente aninhado" | FIX (vide `layer-boundaries`) |
| "Falta JSDoc"                           | FIX                                |
| "Valida essa borda com valibot (`*.schema.ts`)" | FIX (vide `api-contract`)  |
| "Por que buscar dados no Server Component?" | JUSTIFY (RSC-puro: sem React Query/cache) |
| "Considere extrair esse componente"     | depende: pode ser PARTIAL         |

## Checklist final

- [ ] Todo comment pendente classificado
- [ ] Todo fix aplicado, lint + typecheck + test verdes
- [ ] Usuário aprovou plan antes de executar
- [ ] Usuário commitou + pushed antes de responder
- [ ] Todas respostas enviadas com autorização
- [ ] Comments do CodeRabbit começam com `@coderabbitai`
- [ ] Comments humanos sem prefix

## Sinais de alerta: PARE

- Responder sem ler o código
- Aplicar fix antes do plano ser aprovado
- Push automático
- Responder de forma defensiva ("já está certo, leia melhor")

## Racionalizações comuns

| Desculpa                                           | Realidade                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ |
| "CodeRabbit pediu, eu já vi, posso aplicar direto" | Não. Plan + aprovação.                                       |
| "Pequeno fix, pulo o lint"                         | Sempre lint + typecheck.                                    |
| "Vou só responder, sem aplicar"                    | Reviewer leu o código. Resposta sem fix = JUSTIFY explícito. |
