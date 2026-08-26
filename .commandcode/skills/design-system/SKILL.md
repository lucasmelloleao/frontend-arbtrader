---
name: design-system
description: "Sistema de design Tailwind v4: tokens como fonte da verdade (DESIGN.md), 'sem cara de IA' (anti-slop), acessibilidade WCAG, hierarquia e densidade intencionais. Aciona em: componente visual, estilo, tema, layout, cor, tipografia, design."
---

# Design System: sem cara de IA

Stack de estilo **fixa: Tailwind v4** (nunca MUI/Emotion/NativeWind/RN). Pareia com o **impeccable**
(ver `integracoes/impeccable.md`), que herda os SEUS tokens e bloqueia *slop*.

## Tokens são a fonte da verdade

- Os tokens (cores, tipografia, espaçamento, raio) vivem em **`DESIGN.md`** (raiz) e nas CSS vars /
  `@theme` do Tailwind v4. Definidos **uma vez**.
- Componentes **consomem** tokens. **Sem hardcode** de cor/tamanho/raio no markup: nada de `#fff`
  ou `16px` cru. Referencie o token.
- Telas não inventam valores. Valor novo → entra no `DESIGN.md`/tema primeiro.

## Estilo pontual vs reutilizado

- **Pontual** (único, local): `className` com tokens. Sem valor cru.
- **Reutilizado** (≥2 usos ou identidade própria): extraia (componente reutilizável, classe
  componível). Sem CSS global solto.

## "Sem cara de IA" (anti-slop)

- **Hierarquia tipográfica real**: escala intencional (`h1..body`, peso, tracking): não tudo no
  mesmo tamanho/peso.
- **Densidade intencional** ao contexto (dashboard denso ≠ landing espaçada). Não jogar card
  arredondado + sombra + gradiente em tudo.
- **Paleta própria e contida**: não o roxo/índigo default genérico. Bordas/raios consistentes.
- **Proibido slop:** gradiente decorativo, glassmorphism, sombra genérica em tudo, "cara de template".

## Acessibilidade (WCAG 2.1 AA): inegociável

`label` em input, `aria-label` em botão-ícone, `alt` em imagem (e `<Image>` no lugar de `<img>`) já
são garantidos por `jsx-a11y/*` + `nextjs/no-img-element` + a skill `forms`. Aqui é o que o lint
**não** pega:

- **Contraste** AA (texto ≥ 4.5:1): é escolha de cor, regra estática não detecta.
- **Foco visível**: não remova outline sem substituto.
- **Ordem de foco** lógica; **navegação por teclado** em diálogos/menus.

## Organização de componentes

- Onde cada componente mora (shared vs feature) → `layer-boundaries`.
- Estados de tela (loading/empty/erro) são parte da UI burra, dirigidos pelo hook.

## Anti-padrões (FAIL em review)

- Cor/spacing/tipografia hardcoded; valor cru no estilo inline; CSS global solto; misturar dois
  sistemas de estilo; input sem label; outline de foco removido; "cara genérica de template".

## Checklist

- [ ] Cor/spacing/tipografia via tokens (sem hardcode)?
- [ ] Pontual inline / reutilizado extraído?
- [ ] WCAG: label, foco visível, contraste, teclado?
- [ ] Hierarquia e densidade intencionais (não cara de template)?
- [ ] Um único sistema de estilo na stack?

## Skills relacionadas

`nextjs-react19-architecture`, `forms`.
