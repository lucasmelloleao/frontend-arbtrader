import {
  array,
  boolean,
  type InferOutput,
  minLength,
  object,
  pipe,
  safeParse,
  string,
} from "valibot";

/**
 * Chave de API de uma CEX como o backend devolve. Os campos sensíveis
 * (`apiSecret`) nunca vêm no GET — o backend esconde.
 */
const exchangeSchema = object({
  id: string(),
  exchangeId: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da conexão.")),
  apiKey: pipe(string(), minLength(1, "Informe a API Key.")),
  ativa: boolean(),
});

/** Tipo de uma conexão CEX (fonte única — não redeclarar à mão). */
export type Exchange = InferOutput<typeof exchangeSchema>;

/** Lista de conexões CEX: o `data` do envelope de GET /exchanges. */
export const exchangeListSchema = array(exchangeSchema);

/** Payload de criação de chave CEX, espelhando o contrato do backend. */
export const criarExchangeSchema = object({
  exchangeId: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da conexão.")),
  apiKey: pipe(string(), minLength(1, "Informe a API Key.")),
  apiSecret: pipe(string(), minLength(1, "Informe o API Secret.")),
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
 * Payload de edição de chave CEX. `apiSecret` é opcional: vazio significa
 * "manter o segredo atual" (o backend nunca devolve o segredo no GET).
 */
export const editarExchangeSchema = object({
  exchangeId: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da conexão.")),
  apiKey: pipe(string(), minLength(1, "Informe a API Key.")),
  apiSecret: string(),
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
