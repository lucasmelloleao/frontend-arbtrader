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

/** Resultado da mutação no formato que o `useActionState` do React 19 consome. */
export type SalvarExchangeResult = { ok: true } | { ok: false; erro: string };

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível salvar a conexão. Tente novamente.";

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
      json: validado,
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
 * `apiSecret` vazio significa "manter o segredo atual" — o backend nunca
 * devolve o segredo no GET, então o form não pode reenviá-lo.
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
      json: { id, ...validado },
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
