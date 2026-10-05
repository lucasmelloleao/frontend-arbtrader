/**
 * Hook SessionStart: injeta as convenções do boilerplate no contexto do agente
 * já no início da sessão, pra ele escrever conforme os patterns ANTES de qualquer
 * write (reforço proativo, sem bloquear).
 *
 * REGRAS, NÃO OPÇÕES: cada linha é uma diretiva única. Não oferecer alternativas
 * (menu vira alucinação): sempre o caminho prescrito.
 *
 * Roda em Bun (sem node). Saída: JSON com hookSpecificOutput.additionalContext.
 */

const PATTERNS = `# boilerplate: convenções (REGRAS, não opções)

Stack fixa: Next 16 App Router · React 19 + React Compiler · TypeScript 7 nativo ·
Bun ponta a ponta. Este repo é FRONTEND/BFF; o backend REST é separado (api-server).

Runtime: Bun. Proibido \`node\` e \`--experimental-strip-types\`. Não instalar o pacote
\`typescript\` clássico (usamos TS7 nativo + @typescript/native-preview).

Dados: RSC, sempre fresco:
- Leitura de dados = Server Component. Só isso. Não buscar dados no client. Sem lib de
  data-fetching (sem SWR, sem React Query). Proibido fetch/watch em useEffect.
- Proibido cache: \`'use cache'\`, \`unstable_cache\`, \`cache: "force-cache"\`,
  \`revalidate = false | >0\`, \`dynamic: 'force-static'\`.
  \`React.cache()\` (dedup por request) é permitido. Fetches paralelos com Promise.all.
- Mutação de dado = Server Action; depois \`revalidatePath\`/\`router.refresh\` pra repuxar fresco.
- Login/logout/refresh = chamada direta do browser ao backend (ele seta o cookie).
- Forms = react-hook-form + \`valibotResolver\` (schema em \`*.schema.ts\`), revalidado no server. Sem \`watch\` em effect. UI otimista = \`useOptimistic\`.

Auth: cookie JWT same-site (.example.com):
- RSC e Server Action leem o cookie via \`next/headers\` e encaminham ao backend.
- Refresh de token = \`proxy.ts\` (Next 16; não existe \`middleware.ts\`).
- Cookies públicos (user_role/authorities) = só UI. Authz é sempre no backend.
- Proibido decodificar/validar/assinar JWT no front.

Arquitetura: direção única: app → features → lib → shared → externo:
- \`shared\` é folha pura: não importa nada interno.
- \`features/*\` não importa outra feature; o compartilhado vai pra \`shared\`.
- Proibido barrel/\`index\` de re-export. RSC por padrão; \`'use client'\` só nas folhas.

Bordas:
- valibot só em \`*.schema.ts\`. ky só em \`lib/api\`. Acesso ao backend só via \`apiClient\`
  (proibido \`fetch\` cru pro backend). \`server-only\`/\`client-only\` nas bordas.
- Proibido \`document.cookie\` no client.

Qualidade (parte do "done"):
- Nome concreto, fluxo direto, tipos na borda. Sem nome genérico (\`data\`, \`item\`,
  \`helper\`) e sem comentário que só narra o código.
- Erro = feedback seguro ao usuário + contexto útil no servidor, sem vazar
  segredo/token/cookie. Nunca engula erro em silêncio.
- Bugfix → teste de regressão perto do bug. Feature → teste focado no comportamento
  crítico. Nunca teste frágil de implementação nem \`.only\` (foca a suíte e pula o resto).
- Acessibilidade é done: controle interativo real, nome acessível, teclado e estados
  loading/empty/error quando a UI depender deles.

Antes de concluir, estes gates têm que passar: \`bun run typecheck\`,
\`bun run typecheck:tooling\`, \`bun run lint\`, \`bun test\`.

Commit / push / PR (REGRAS):
- Só faça commit ou push quando o usuário pedir. Sem pedido, não commita nem pusha.
- Nunca junte tudo num commit só. Divida por domínio (um commit por área coesa:
  auth, forms, lib/api, tooling, docs...).
- Antes de commitar/pushar, cheque a branch atual: nunca commite nem pushe direto
  na \`main\` (features entram via PR pra \`main\`).
- PR sempre tem como base a \`main\`.
- Descrição do PR é obrigatoriamente bem detalhada: o que muda e por quê, as
  regras de negócio assumidas, decisões/trade-offs e o test plan.

Fonte canônica (leia se precisar de detalhe/exemplo/porquê): ARCHITECTURE.md ·
CODE-PATTERN.md · MEMORY.md (log de decisões). As regras acima são impostas por oxlint.`;

// process.stdout.write (não console.log) pra não violar no-console se o arquivo
// for lintado explicitamente (ex.: lefthook passando staged files).
process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: PATTERNS,
    },
  }) + "\n",
);
