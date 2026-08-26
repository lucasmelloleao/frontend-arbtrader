---
name: <Nome do Produto>
description: <uma linha: o que é + personalidade visual>
colors:
  primary: '#000000'
  primary-tint: '#F2F2F2'
  primary-border: '#E0E0E0'
  ink: '#11181C'
  text-secondary: '#6B7280'
  text-muted: '#9CA3AF'
  surface: '#FFFFFF'
  surface-alt: '#F9FAFB'
  border: '#E5E7EB'
  success: '#22C55E'
  warning: '#F59E0B'
  danger: '#EF4444'
  info: '#3B82F6'
  # dark mode (opcional)
  dm-bg: '#1A1B1F'
  dm-surface: '#222530'
  dm-fg: '#FAFAFA'
  dm-border: '#2E3340'
typography:
  headline:
    fontFamily: '<ex.: Inter_700Bold>'
    fontSize: '30px'
    fontWeight: 700
  title:
    fontFamily: '<ex.: Inter_600SemiBold>'
    fontSize: '20px'
    fontWeight: 600
  body:
    fontFamily: '<ex.: Inter_400Regular>'
    fontSize: '16px'
    fontWeight: 400
  caption:
    fontFamily: '<ex.: Inter_400Regular>'
    fontSize: '13px'
    fontWeight: 400
spacing:
  base: 4   # escala 4pt: 4, 8, 12, 16, 24, 32...
radius:
  sm: 6
  md: 10
  lg: 16
---

# Design System: <Nome do Produto>

> Template. O frontmatter acima é a **fonte da verdade de tokens**: código consome daqui, nunca
> valores mágicos. Trabalho de design (criar/auditar/polir) via `impeccable`
> (ver `integracoes/impeccable.md`).

## Princípios visuais

<3-5 princípios. Ex.: hierarquia clara, contraste WCAG AA, densidade adequada ao contexto, cor
primária só em ações primárias e estados ativos (nunca decoração espalhada), "sem cara de IA".>

## Uso dos tokens

- **Cores**: referencie os tokens (nunca hex inline). `primary` = ações primárias/estados ativos.
- **Tipografia**: use os papéis (`headline`/`title`/`body`/`caption`), não tamanhos avulsos.
- **Espaçamento/raio**: escala definida no frontmatter: sem números mágicos.

## Acessibilidade

<Contraste mínimo, tamanho de alvo de toque, foco visível, labels semânticos.>

## Componentes-chave (opcional)

<Anatomia dos componentes recorrentes: botão, input, card: variantes e estados.>
