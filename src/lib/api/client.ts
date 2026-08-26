import type { StandardSchemaV1 } from "@standard-schema/spec";
import { HTTPError, type KyInstance, type Options } from "ky";

/** Valor JSON arbitrário: o `data` do envelope vem de `JSON.parse`, então é JSON, não `unknown`. */
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Envelope padrão de toda resposta do backend (sucesso e erro). `success` e
 * `message` são fixos do contrato: sempre presentes e iguais em todo endpoint.
 * Por isso o `apiClient` os assume e nenhum schema de chamada precisa
 * redeclará-los; `data` é a parte opcional e específica do endpoint, validada
 * pelo schema.
 *
 * Se o seu backend responde outro formato, este type e o `requestEnvelope` são
 * o ÚNICO lugar a mudar — o resto do app não conhece o envelope.
 */
type ApiEnvelope = {
  success: boolean;
  message: string;
  data?: Json;
  pagination?: Json;
};

/**
 * Texto seguro pra UI quando a chamada falha sem o envelope do backend:
 * transporte (o `fetch` rejeita por rede, timeout, DNS ou CORS, e nunca chega ao
 * backend) ou infra fora do backend (um proxy/gateway devolvendo não-JSON num
 * 5xx). Nesses casos não existe a `message` do contrato, e o `error.message` cru
 * (o `TypeError: Failed to fetch` do browser) é técnico e em inglês. A borda
 * troca por este texto; o erro original vai no `cause`, pra manter contexto no
 * log sem vazar pra tela.
 */
const CONNECTION_ERROR_MESSAGE =
  "Não foi possível concluir a solicitação. Tente novamente em instantes.";

/**
 * Dispara a requisição e trata o erro na borda, comum ao `apiClient` e ao
 * `apiClientPaginated`: em erro HTTP com envelope do backend, propaga a
 * `message` segura do contrato; sem envelope (transporte de rede ou infra fora
 * do backend, como proxy devolvendo não-JSON num 5xx), entrega a
 * `CONNECTION_ERROR_MESSAGE` com o erro original no `cause`.
 */
async function requestEnvelope(
  ky: KyInstance,
  path: string,
  options?: Options,
): Promise<ApiEnvelope> {
  try {
    return await ky(path, options).json<ApiEnvelope>();
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      // ky já consome o corpo do response e entrega o envelope parseado em
      // `error.data` (por isso `response.json()` não funciona mais aqui). O
      // narrowing aqui não é defesa contra o contrato do backend (esse sempre
      // traz `message`), e sim contra resposta de infra fora do backend (um
      // proxy/gateway devolvendo não-JSON num 5xx). A `message` do contrato
      // vira o texto seguro pra UI.
      const failure: unknown = error.data;
      if (
        failure !== null &&
        typeof failure === "object" &&
        "message" in failure &&
        typeof failure.message === "string"
      ) {
        throw new Error(failure.message, { cause: error });
      }
      // Backend legado responde `{ error }` em vez do envelope `{ message }`.
      // O contrato do boilerplate usa `message`, mas aceitar `error` mantém o
      // texto real do backend na UI em vez do fallback genérico.
      if (
        failure !== null &&
        typeof failure === "object" &&
        "error" in failure &&
        typeof failure.error === "string"
      ) {
        throw new Error(failure.error, { cause: error });
      }
    }
    throw new Error(CONNECTION_ERROR_MESSAGE, { cause: error });
  }
}

/**
 * Gateway único de acesso ao backend: faz a requisição, trata o erro na borda e
 * valida o `data` específico do endpoint, devolvendo o tipo inferido do schema.
 *
 * É por causa desta função que "buscar sem validar" é impossível no repo: o
 * lint proíbe `fetch` cru pro backend e `ky` fora de `lib/api`, então todo dado
 * que entra no app passou por um schema.
 *
 * A validação roda pela interface Standard Schema (`schema["~standard"]`), não
 * pela API do valibot: o lint confina `import "valibot"` aos `*.schema.ts`,
 * então `lib/api` valida sem acoplar a um validador específico. O schema de cada
 * chamada descreve só o `data` do contrato; `success`/`message` são fixos do
 * envelope e ficam por conta do gateway.
 *
 * @param ky - Instância ky da camada (`kyServer` em RSC, `kyClient` no browser).
 * @param path - Caminho relativo ao `baseUrl` da instância (sem barra inicial).
 * @param dataSchema - Schema do `data` esperado; define o tipo de retorno.
 * @param options - Opções ky da chamada (método, `json`, `searchParams`...).
 * @returns O `data` validado e tipado do schema.
 * @throws `Error` com o `message` do backend quando a chamada HTTP falha.
 */
export async function apiClient<Schema extends StandardSchemaV1>(
  ky: KyInstance,
  path: string,
  dataSchema: Schema,
  options?: Options,
): Promise<StandardSchemaV1.InferOutput<Schema>>;
/**
 * Sobrecarga para endpoints sem `data` no contrato (ex.: login, cuja identidade
 * vem do cookie HttpOnly): dispara a requisição, propaga o `message` do backend
 * em erro e não devolve dado.
 */
export async function apiClient(
  ky: KyInstance,
  path: string,
  dataSchema?: undefined,
  options?: Options,
): Promise<undefined>;
export async function apiClient<Schema extends StandardSchemaV1>(
  ky: KyInstance,
  path: string,
  dataSchema?: Schema,
  options?: Options,
): Promise<StandardSchemaV1.InferOutput<Schema> | undefined> {
  const envelope = await requestEnvelope(ky, path, options);

  // `success`/`message` são fixos do contrato, então não são revalidados aqui
  // (sem narrowing defensivo). Só o `data` específico do endpoint passa pelo
  // schema da chamada; endpoint sem `data` não recebe schema.
  if (!dataSchema) {
    return undefined;
  }
  const result = await dataSchema["~standard"].validate(envelope.data);
  if (result.issues) {
    throw new Error(result.issues[0]?.message);
  }
  return result.value;
}

// Sem variante paginada aqui de propósito: o repo proíbe abstração sem caller
// real (YAGNI, ver CODE-PATTERN §9). Quando o seu primeiro endpoint devolver
// `pagination` como irmã de `data` no envelope, extraia uma `apiClientPaginated`
// reaproveitando o `requestEnvelope` acima — a borda já está pronta pra isso.
