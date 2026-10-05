"use server";

import { revalidatePath } from "next/cache";

import {
  parseCriarExchange,
  parseEditarExchange,
  type CriarExchangeInput,
  type EditarExchangeInput,
} from "@/features/exchanges/exchanges.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";
import { isCtraderId, isFixId } from "@/shared/constants/supported-cex";

/** Resultado da mutação no formato que o `useActionState` do React 19 consome. */
export type SalvarExchangeResult = { ok: true } | { ok: false; erro: string };

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível salvar a conexão. Tente novamente.";

/** Monta o corpo do POST/PUT com os campos não vazios do payload. */
function corpoComCampos<Entrada extends { exchangeId: string; nome: string }>(
  entrada: Entrada,
  campos: readonly (keyof Entrada)[],
): Record<string, string | number> {
  const corpo: Record<string, string | number> = {
    exchangeId: entrada.exchangeId,
    nome: entrada.nome,
  };
  for (const campo of campos) {
    const valor = entrada[campo];
    if (typeof valor === "string" && valor !== "") {
      corpo[String(campo)] = valor;
    } else if (typeof valor === "number") {
      corpo[String(campo)] = valor;
    }
  }
  return corpo;
}

/**
 * Monta o corpo do POST/PUT conforme o tipo de corretora: cTrader envia
 * `clientId`/`clientSecret`/`accessToken`/`refreshToken`/`accountId`/
 * `username`/`environment`; FIX envia `host`/`quotePort`/`tradePort`/
 * `senderCompId`/`targetCompId`/`username`/`password`; as CEX padrão enviam
 * `apiKey`/`apiSecret`. Evita mandar campos vazios que o backend rejeita.
 */
function corpoExchange(
  entrada: CriarExchangeInput | EditarExchangeInput,
): Record<string, string | number> {
  if (isCtraderId(entrada.exchangeId)) {
    const corpo = corpoComCampos(entrada, [
      "clientId",
      "clientSecret",
      "accessToken",
      "refreshToken",
      "accountId",
      "username",
    ]);
    corpo.environment = entrada.environment ?? "live";
    return corpo;
  }

  if (isFixId(entrada.exchangeId)) {
    return corpoComCampos(entrada, [
      "host",
      "quotePort",
      "tradePort",
      "senderCompId",
      "targetCompId",
      "username",
      "password",
    ]);
  }

  return corpoComCampos(entrada, ["apiKey", "apiSecret"]);
}

/**
 * Cria (ou atualiza) a chave de API de uma corretora centralizada.
 *
 * Revalida no servidor o payload que já passou pelo `valibotResolver` no
 * client. O `apiSecret` vai no corpo; o backend criptografa e nunca devolve.
 *
 * @param entrada - Campos do formulário de nova conexão CEX.
 * @returns `{ ok: true }` ou `{ ok: false, erro }` com a mensagem do backend.
 */
export async function salvarExchange(entrada: CriarExchangeInput): Promise<SalvarExchangeResult> {
  try {
    const validado = parseCriarExchange(entrada);
    // Sem schema: o contrato de criação não devolve `data` útil para a UI.
    await apiClient(kyServer, API_ENDPOINTS.exchanges.criar, undefined, {
      method: "post",
      json: corpoExchange(validado),
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }

  revalidatePath("/dashboard/exchanges");
  return { ok: true };
}

/**
 * Atualiza a chave de API de uma corretora centralizada.
 *
 * `apiSecret`/`clientSecret` vazios significam "manter o segredo atual" — o
 * backend nunca devolve o segredo no GET, então o form não pode reenviá-lo.
 *
 * @param id - Id da conexão a atualizar.
 * @param entrada - Campos editáveis da conexão.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function atualizarExchange(
  id: string,
  entrada: EditarExchangeInput,
): Promise<SalvarExchangeResult> {
  try {
    const validado = parseEditarExchange(entrada);
    await apiClient(kyServer, API_ENDPOINTS.exchanges.atualizar, undefined, {
      method: "put",
      json: { id, ...corpoExchange(validado) },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }

  revalidatePath("/dashboard/exchanges");
  return { ok: true };
}

/**
 * Remove a chave de API de uma corretora pelo id.
 *
 * @param id - Id da conexão a remover.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function deletarExchange(id: string): Promise<SalvarExchangeResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.exchanges.deletar, undefined, {
      method: "delete",
      searchParams: { id },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }

  revalidatePath("/dashboard/exchanges");
  return { ok: true };
}
