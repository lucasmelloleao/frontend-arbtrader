---
name: typescript-strict
description: 'Use quando estiver escrevendo TypeScript neste projeto: qualquer arquivo .ts/.tsx. Sintomas: tentação de `any`, `as`, non-null `!`, default export fora de `src/app`, path relativo longo, `console.log`/`debug`, `forwardRef`, interface (use `type`), tipo de valibot schema não inferido.'
---

# TypeScript Strict Standards

## Visão geral

TypeScript estrito no projeto inteiro, end-to-end: spec (OpenAPI) → valibot schema → `InferOutput<typeof>` → prop do componente. A **maioria** das regras é **imposta por oxlint**: esta skill carrega só o que o lint NÃO expressa: o racional do "por que não", a escolha `type` vs `interface`, e o fluxo de tipos.

## O que o lint já impõe: rode `bun run lint`

São **erro** de oxlint (não relisto aqui; o gate pega): `any` (`no-explicit-any`), `as` exceto `as const` (`consistent-type-assertions: never`), non-null `!` (`no-non-null-assertion`), `default export` fora de `src/app/**` (`import/no-default-export`), import relativo de pai (`import/no-relative-parent-imports`), `console.log`/`debug` (`no-console`, allow `warn`/`error`), var/param não usado (`no-unused-vars`).

Delegações (cada uma tem dona): naming de arquivo/símbolo → `naming-conventions`. Aliases `@/*` e subpath/camadas → `layer-boundaries`. `forwardRef`/`ref` como prop → `nextjs-react19-architecture`. valibot/`InferOutput`/`parse` vs `safeParse` → `forms` e `api-contract`.

## `type` sobre `interface` (não-lintável: convenção do projeto)

Não há regra oxlint para isto. Use **`type` sempre** (consistência + união/interseção/mapped/condicional, que `interface` não faz). `interface` só se precisar de declaration merging (raro): documente o porquê.

## Fluxo de tipos end-to-end

spec (OpenAPI) → `*.schema.ts` (valibot) → `InferOutput<typeof schema>` (a **fonte** do tipo runtime) → prop do componente. **Nunca** escreva o tipo do backend à mão (ver `api-contract`). Deixe o compilador inferir quando puder: não anote o que ele já sabe.

## Sinais de alerta: PARE

- Vai escrever `any` "só pra desbloquear" → `unknown` + type guard custa 1 linha e é seguro.
- Vai usar `as` pra calar o TS → `as` mente pro compilador; resolva a inferência de verdade.
- Vai usar `!` pra silenciar "possibly undefined" → trate (narrowing, default, ou throw).
- Vai criar `interface` em código novo → use `type`.

## Racionalizações comuns

| Desculpa                                 | Realidade                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| "É só `any` aqui, refatoro depois"       | Não. `unknown` + type guard custa 1 linha a mais e é seguro. |
| "TS reclamando, vou colocar `as` rápido" | `as` mente pro compilador. Resolve a inferência de verdade.  |
| "Interface é melhor pra OOP"             | OOP não é o estilo do projeto. Consistência diz `type`.      |
| "Default export é mais limpo"            | Named export é searchable. Default não.                      |
| "../../ ainda é alias"                   | Não. Use o alias `@/*` do tsconfig.                          |

## Verificação

Rode `bun run lint`: o oxlint pega `any`/`as`/`!`/default export/relativo/`console.log` por construção. O que o lint não pega (`type` vs `interface`, tipo do backend à mão) é revisão humana: ver `api-contract` para o fluxo de tipos.
