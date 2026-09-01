import {
  array,
  boolean,
  type InferOutput,
  literal,
  minLength,
  number,
  object,
  optional,
  pipe,
  safeParse,
  string,
  union,
} from "valibot";

/** Ambiente da cTrader Open API (Pepperstone). */
const environmentSchema = union([literal("live"), literal("demo")]);

/**
 * Chave de API de uma CEX como o backend devolve. Os campos sensíveis
 * (`apiSecret`) nunca vêm no GET — o backend esconde. Para cTrader, o `apiKey`
 * é o espelho do `clientId`; os campos específicos (clientId/accountId/
 * environment/host/ports/etc.) podem vir do GET conforme o swagger (opcionais
 * por tolerância — o backend atual ainda só devolve o núcleo).
 */
const exchangeSchema = object({
  id: string(),
  exchangeId: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da conexão.")),
  apiKey: pipe(string(), minLength(1, "Informe a API Key.")),
  ativa: boolean(),
  clientId: optional(string()),
  accountId: optional(string()),
  environment: optional(environmentSchema),
  host: optional(string()),
  senderCompId: optional(string()),
  targetCompId: optional(string()),
  username: optional(string()),
  quotePort: optional(number()),
  tradePort: optional(number()),
  jnlpUrl: optional(string()),
  // ─── Polymarket ──────────────────────────────────────────────────────────
  relayerApiKey: optional(string()),
  depositWallet: optional(string()),
  clobApiKey: optional(string()),
  pusdBalance: optional(number()),
});

/** Tipo de uma conexão CEX (fonte única — não redeclarar à mão). */
export type Exchange = InferOutput<typeof exchangeSchema>;

/** Lista de conexões CEX: o `data` do envelope de GET /exchanges. */
export const exchangeListSchema = array(exchangeSchema);

/**
 * Payload de criação de chave CEX, espelhando o contrato do backend.
 *
 * Para cTrader/Pepperstone (`ctrader`/`pepperstone`) os campos usados são
 * `clientId`/`clientSecret`/`accessToken`/`refreshToken`/`accountId`/
 * `username`/`environment`; para FIX API (`fix`/`pepperstone-fix`/
 * `ctrader-fix`) são `host`/`quotePort`/`tradePort`/`senderCompId`/
 * `targetCompId`/`username`/`password`; para as CEX spot/perp padrão,
 * `apiKey`/`apiSecret`. Os campos são opcionais no schema e a escolha de qual
 * enviar é feita na action conforme o `exchangeId`.
 */
export const criarExchangeSchema = object({
  exchangeId: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da conexão.")),
  apiKey: optional(string()),
  apiSecret: optional(string()),
  clientId: optional(string()),
  clientSecret: optional(string()),
  accessToken: optional(string()),
  refreshToken: optional(string()),
  accountId: optional(string()),
  environment: optional(environmentSchema),
  host: optional(string()),
  quotePort: optional(number()),
  tradePort: optional(number()),
  senderCompId: optional(string()),
  targetCompId: optional(string()),
  username: optional(string()),
  password: optional(string()),
});

/** Payload do formulário de nova chave CEX. */
export type CriarExchangeInput = InferOutput<typeof criarExchangeSchema>;

/**
 * Revalida no servidor o payload que já passou pelo `valibotResolver` no client.
 *
 * Mora aqui porque `valibot` é confinado aos `*.schema.ts`: a borda de
 * validação é este arquivo.
 *
 * @param entrada - Payload cru vindo do formulário.
 * @returns Os campos validados.
 * @throws `Error` com a primeira mensagem de validação.
 */
export function parseCriarExchange(entrada: unknown): CriarExchangeInput {
  const resultado = safeParse(criarExchangeSchema, entrada);
  if (!resultado.success) {
    // `issues` do valibot é tupla não-vazia: o primeiro item sempre existe.
    throw new Error(resultado.issues[0].message);
  }
  return resultado.output;
}

/**
 * Payload de edição de chave CEX. `apiSecret`/`clientSecret`/`password` são
 * opcionais: vazio significa "manter o segredo atual" (o backend nunca devolve
 * o segredo no GET).
 */
export const editarExchangeSchema = object({
  exchangeId: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da conexão.")),
  apiKey: optional(string()),
  apiSecret: optional(string()),
  clientId: optional(string()),
  clientSecret: optional(string()),
  accessToken: optional(string()),
  refreshToken: optional(string()),
  accountId: optional(string()),
  environment: optional(environmentSchema),
  host: optional(string()),
  quotePort: optional(number()),
  tradePort: optional(number()),
  senderCompId: optional(string()),
  targetCompId: optional(string()),
  username: optional(string()),
  password: optional(string()),
});

/** Payload do formulário de edição de chave CEX. */
export type EditarExchangeInput = InferOutput<typeof editarExchangeSchema>;

/**
 * Revalida no servidor o payload de edição.
 *
 * @param entrada - Payload cru vindo do formulário.
 * @returns Os campos validados.
 * @throws `Error` com a primeira mensagem de validação.
 */
export function parseEditarExchange(entrada: unknown): EditarExchangeInput {
  const resultado = safeParse(editarExchangeSchema, entrada);
  if (!resultado.success) {
    // `issues` do valibot é tupla não-vazia: o primeiro item sempre existe.
    throw new Error(resultado.issues[0].message);
  }
  return resultado.output;
}
