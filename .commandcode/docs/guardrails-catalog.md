# Catálogo de guardrails

Este é o catálogo de julgamento do Stack Sênior. Ele cobre o que oxlint,
TypeScript, Knip e os testes não conseguem provar sozinhos. A skill `pre-review`
usa este arquivo como fonte única; se uma regra mudar, atualize aqui antes de
alterar a skill.

O catálogo é deliberadamente menor que um manual de estilo. Ele existe para
cortar decisões desnecessárias, evitar contornos silenciosos e preservar a
arquitetura que o repositório já torna verificável.

## A. Complexidade e abstração

- Um caller fica inline. Extração local começa no segundo caller real.
- Abstração genérica, como factory, provider ou hook genérico, exige três usos
  concretos. Um primitivo de produto que já nasce compartilhado é uma exceção de
  colocação, não uma licença para generalizar.
- Wrapper que só repassa argumentos, inclusive para `apiClient`, deve desaparecer.
- Não transforme um map pequeno, narrowing ou parse local em módulo e teste isolado
  apenas para organizar o arquivo.
- Não crie parâmetro, flag, adapter ou caminho de compatibilidade para um requisito
  que ainda não existe.

## B. Fallback e tratamento de erro

- Não use `?? ''`, `|| []`, `|| {}`, `?? 0` ou optional chaining redundante quando o
  tipo, schema ou fluxo já garante o valor.
- Não engula exceções nem fabrique `null`, arrays vazios ou envelopes alternativos.
  Falha visível recebe feedback seguro; falha de servidor sobe com contexto útil,
  sem token, cookie ou segredo.
- Não revalide ou remapeie uma resposta que `apiClient` já validou na borda.
- Erro do backend não vira workaround no frontend. Reporte o erro e recomende
  corrigir o contrato ou o backend; um contorno exige decisão explícita.

## C. Domínio e autorização

- Preço, desconto, elegibilidade, limite, período e agregação pertencem ao contrato
  do backend. A UI exibe o resultado e não inventa uma segunda regra.
- Cookie público pode orientar a apresentação, nunca autorizar acesso.
- O frontend não decodifica, valida ou assina JWT.
- Mutação revalida a tela com `revalidatePath` ou `router.refresh`.
- Regra de negócio ambígua é uma pergunta, não uma suposição.

## D. Código e linguagem

- Reuse o tipo, utilitário, schema, máscara ou formatter que já existe. Não crie um
  sinônimo.
- Prefira nomes concretos a `data`, `item`, `helper` e `result`.
- Comentário explica motivo, limite ou trade-off duradouro. Não narra o diff.
- Código e identificadores ficam em inglês; texto visível fica em PT-BR natural,
  com acentuação e sem tom robótico.
- Um catálogo ou enum tem uma fonte de verdade. Não repita ids literais em
  `if`, `switch` ou `===`.

## E. Interface e acessibilidade

- Use elemento semântico para cada ação. Não transforme `div` em botão.
- Todo controle tem nome acessível, foco visível, alvo confortável e ordem de
  teclado previsível.
- Fluxos assíncronos precisam de estados de loading, sucesso e erro. Listas e
  consultas precisam tratar vazio quando esse estado for possível.
- Cor, tipografia, espaçamento, raio e sombra vêm de `DESIGN.md` e dos tokens do
  tema. Não use hex, RGB ou valores arbitrários no JSX.
- Contraste AA e `prefers-reduced-motion` fazem parte do pronto.

## F. Mídia, responsividade e performance

- Imagem de conteúdo usa `next/image`; raster pesado não entra em `public/` sem
  otimização e sem razão registrada.
- A composição precisa funcionar em celular, largura intermediária e tela ampla.
  Não use breakpoint acima de 1366px sem um caso real.
- Leituras independentes rodam em paralelo. I/O lento fica sob `Suspense` quando
  a rota puder entregar o shell antes do dado.
- Terceiros e componentes pesados entram apenas onde são necessários. Não aumente
  o bundle inicial por conveniência.

## G. Testes e entrega

- Bug corrigido recebe teste de regressão próximo do comportamento corrigido.
- Teste verifica resultado e interação, não nome de função, classe ou detalhe de
  implementação.
- Código novo segue a convenção de arquivo, não cria barrel e não deixa export,
  dependência ou arquivo morto.
- Antes de abrir PR: `bun run verify`, depois `/pr-ready`, `/pre-review` e
  `/create-pr`, nessa ordem.

## Não duplicar o que o gate já prova

Na `pre-review`, não repita famílias já cobertas pelo `verify`: direção de camadas,
barrels, cache proibido, fetch em effect, localização de `valibot` e `ky`, acesso ao
backend fora de `apiClient`, JWT, `document.cookie`, assertions proibidas, código
morto, runtime Node e type-check. A pré-review existe para o julgamento que ainda
precisa de contexto.

## Permitido e intencional

- `React.cache()` para deduplicação por request, `Promise.all` e `useOptimistic`.
- `'use client'` em folhas que realmente usam browser ou interação.
- `as const` quando a constante precisa preservar seus literais.
- Email, telefone, URL de marketing e copy como conteúdo de UI.
- Exceções de contrato externo quando forem confirmadas e documentadas.
