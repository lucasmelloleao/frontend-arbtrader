"use server";

import { revalidatePath } from "next/cache";

import {
  forexArbLogsSchema,
  type AtualizarForexSettingsInput,
  type CriarForexStrategyInput,
  type ForexArbLogs,
} from "@/features/forex-arb/forex-arb.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/** Resultado padrão de mutação. */
export type MutacaoResult = { ok: true } | { ok: false; erro: string };

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível concluir. Tente novamente.";

/** Resultado da busca de logs. */
export type LogsResult = { ok: true; logs: readonly string[] } | { ok: false; erro: string };

/**
 * Busca os logs do robô Forex (GET /forex-arb/logs?process=&lines=).
 *
 * @param process - Nome do processo (forex-arb | forex-scanner).
 * @param lines - Quantidade de linhas.
 * @returns `{ ok: true, logs }` ou `{ ok: false, erro }`.
 */
export async function buscarLogs(process: string, lines: number): Promise<LogsResult> {
  try {
    const data: ForexArbLogs = await apiClient(
      kyServer,
      API_ENDPOINTS.forexArb.logs,
      forexArbLogsSchema,
      {
        method: "get",
        searchParams: { process, lines: String(lines) },
      },
    );
    return { ok: true, logs: data.logs };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Atualiza as configurações do robô Forex (POST /forex-arb/settings).
 */
export async function salvarSettings(entrada: AtualizarForexSettingsInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.settings, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}

/**
 * Cria uma nova estratégia Forex manualmente (POST /forex-arb/strategies).
 */
export async function criarStrategy(entrada: CriarForexStrategyInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.criarStrategy, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}

/**
 * Aciona o fechamento de uma posição Forex aberta (POST /forex-arb/close).
 */
export async function fecharPosicao(strategyId: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.fechar, undefined, {
      method: "post",
      json: { strategyId },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}

/**
 * Remove uma estratégia Forex pelo id (DELETE /forex-arb/strategies).
 */
export async function deletarStrategy(id: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.deletarStrategy, undefined, {
      method: "delete",
      searchParams: { id },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}

/**
 * Encerra TODAS as posições abertas no Forex (POST /forex-arb/close-all).
 */
export async function fecharTodasPosicoes(): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.fecharTodas, undefined, {
      method: "post",
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}

/**
 * Apaga todas as operações e estratégias Forex do histórico do usuário (DELETE /forex-arb/trades).
 */
export async function deletarTodasOperacoes(): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.limparTrades, undefined, {
      method: "delete",
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}
