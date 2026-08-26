---
name: core-principles
description: "Use quando estiver implementando QUALQUER código neste projeto: aplicar continuamente. Sintomas: vai criar abstração, vai adicionar parâmetro 'por precaução', vai escrever fallback silencioso, vai usar `console.log`/`debug`, vai escrever teste por implementação em vez de comportamento."
---

# Core Engineering Principles

## Visão geral

Princípios não-negociáveis que ficam acima de qualquer skill específica. KISS, YAGNI, observabilidade, JSDoc, behavior-driven tests, error handling humanizado.

## Quando usar

- Sempre, em qualquer código novo ou alterado neste repo.

## Quando NÃO usar

- Para regras de naming → `naming-conventions`
- Para regras de TypeScript → `typescript-strict`
- Para regras de boundary → `layer-boundaries`

## YAGNI: princípio fundamental

Antes de **qualquer** adição:

> "Isso é necessário AGORA ou estou antecipando um requisito que talvez nunca venha?"

Se "talvez no futuro" → **não implementa**.

- Sem feature "pro futuro"
- Sem abstração prematura
- Sem parâmetro "por precaução"
- Sem generalização antes de ter ≥3 casos concretos
- Refatora quando necessário, não preventivamente

## KISS

- Código mais simples que funciona ganha do código mais elegante que parece flexível
- Pasta com um único arquivo deveria ser um arquivo
- Código é referência, histórico e funcionalidade: deve ler como journal
- Arquivo ≤ 300 linhas, função ≤ 120 linhas (guia KISS: não há regra de lint pra isso)

## Sem fallback silencioso, sem opcionalidade frouxa

- Toda prop opcional precisa: default explícito OU JSDoc explicando por que `undefined` é semanticamente diferente
- Toda chamada HTTP que pode falhar passa pelo `apiClient` (`lib/api`). Proibido `try { } catch { /* ignore */ }`
- Toda mensagem ao usuário vem de constante nomeada em PT-BR. Proibido renderizar `error.message` cru
- Função de I/O (`lib/api`/Server Action) que pode falhar **lança**: não retorna `null` mascarando

## Observabilidade

```typescript
console.warn('Token expirando em breve', { expiresAt });
console.error('Falha na requisição', { error, context });
```

- **NUNCA** `console.log`/`console.debug` (oxlint bloqueia); `console.warn`/`console.error` são permitidos
- Contexto estruturado (`{ endpoint, userId, error }`): não string solta
- Não há camada de `logger`; registro relevante vai direto em `console.warn`/`error`
- Sanitização de PII (CPF, telefone, token) antes de logar

## JSDoc: obrigatório

- Toda função, componente, hook **exportado** tem JSDoc completo
- Proibido `//`, `/* */`, `{/* */}` dentro de implementação
- Comments explicam **por quê**, não **o quê** (o código já diz o quê)
- JSDoc é o contrato: sem ele, o próximo dev recria a função

```typescript
/**
 * Campo de busca com debounce e acessibilidade pronta.
 *
 * @param value - Valor atual do input.
 * @param onChange - Callback de atualização.
 * @returns Elemento JSX do campo de busca.
 */
export function SearchField({ value, onChange }: SearchFieldProps): JSX.Element {
  return <input value={value} onChange={onChange} />;
}
```

## Tratamento de erro

- Mensagens user-facing em PT-BR, vindas de constante
- `console.error()` com contexto (sem camada de logger)
- `<ErrorBoundary>` por rota
- A chamada de I/O (`lib/api`/Server Action) propaga erro tipado (`ApiError`); hook decide como apresentar
- Sem `Result` discriminated union genérico: YAGNI

## Testes: comportamento, não implementação

- Test comportamento, não detalhe interno
- Test para cada bug corrigido (previne regressão)
- Nomes em PT-BR, terceira pessoa: `renderiza corretamente`, `chama callback quando pressionado`
- Organização em `describe` blocks
- Localização e naming do arquivo de teste → `naming-conventions`
- Snapshots apenas para componentes visuais estáveis e pequenos (< 10 KB)
- Runner é `bun test --pass-with-no-tests` (não existe Jest neste projeto)

```typescript
describe('<LeadCard />', () => {
  describe('Renderização básica', () => {
    test('renderiza nome do lead', () => { ... });
  });
  describe('Interações', () => {
    test('chama onSelect quando pressionado', () => { ... });
  });
});
```

## Segurança & acessibilidade

- OWASP best practices
- WCAG 2.1 (alvos de toque ≥ 44px, `aria-label`)
- JWT é responsabilidade do backend; no front, sessão vive em cookie lido/escrito via `next/headers` (Server). Proibido `document.cookie`, `jose`/`jsonwebtoken` no cliente
- Sem token em log, sem CPF em log

## Evite

- Otimização prematura
- Abstração inútil (função que só chama outra função, helper usado 1 vez)
- Over-engineering
- Magic string/number (extrair pra constante nomeada)
- Comentário que descreve "o quê" em vez de "por quê"

## Referência rápida

| Tentação                                                  | Decisão                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| "Vou criar uma função genérica caso precise depois"       | NÃO. Cria específica. Generaliza quando aparecerem 3 casos. |
| "Adiciono esse parâmetro `enabled?` por via das dúvidas"  | NÃO. Se não usa agora, não cria.                            |
| "Esse `try/catch` engole e mostra toast genérico"         | NÃO. Propaga, hook decide, mensagem em constante.           |
| "Vou logar com `console.log` só pra debug rápido"         | NÃO. `console.log`/`debug` banidos; use `console.warn`/`error`.                     |
| "JSDoc nesse helper trivial é over"                       | NÃO. Helper exportado tem JSDoc. Ponto.                     |
| "Testo a implementação interna do hook (chamou X função)" | NÃO. Testa o comportamento observável.                      |

## Sinais de alerta: PARE

- "Pra ser mais flexível"
- "Caso precise no futuro"
- "Sé que não vai usar agora, mas..."
- "Vou abstrair antes pra economizar tempo depois"
- "É só um console.log de debug"
- "Esse fallback é bom pra UX"

## Racionalizações comuns

| Desculpa                                         | Realidade                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| "É só 2 linhas a mais pra ficar genérico"        | 2 linhas hoje + manutenção pra sempre + ninguém usa. Específico.                      |
| "Esse helper trivial não precisa de JSDoc"       | Trivial pra você. Próximo dev abre o helper pra descobrir o que faz. JSDoc.           |
| "Console.log que esqueci no commit é inofensivo" | Oxlint bloqueia. Conserta antes do commit.                                            |
| "Vou tipar `Result<T, E>` pra toda chamada"      | YAGNI. A chamada lança, hook captura. Discriminated union só quando provado necessário. |
