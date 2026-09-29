"use server";

import { revalidatePath } from "next/cache";

import {
  forexArbLivePricesSchema,
  forexArbLogsSchema,
  type AtualizarForexSettingsInput,
  type CriarForexStrategyInput,
  type ForexArbAiMetadata,
  type ForexArbAiStatus,
  type ForexArbLogs,
  type ForexArbStrategy,
  type ForexArbTrade,
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
 * @param process - Nome do processo PM2 (pepperstone-engine).
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
 * Busca as cotações ao vivo no servidor (GET /forex-arb/live-prices).
 */
export async function buscarCotacoesAoVivo(): Promise<Record<
  string,
  { bid: number; ask: number; mid: number }
> | null> {
  try {
    return await apiClient(kyServer, API_ENDPOINTS.forexArb.livePrices, forexArbLivePricesSchema);
  } catch {
    return null;
  }
}

/**
 * Busca a lista atualizada de estratégias Forex diretamente no servidor.
 */
export async function buscarEstrategiasForex(): Promise<readonly ForexArbStrategy[]> {
  try {
    const { forexArbStrategyListSchema } = await import("@/features/forex-arb/forex-arb.schema");
    return await apiClient(kyServer, API_ENDPOINTS.forexArb.listarStrategies, forexArbStrategyListSchema);
  } catch {
    return [];
  }
}

/**
 * Busca a lista atualizada de trades Forex diretamente no servidor.
 */
export async function buscarTradesForex(): Promise<readonly ForexArbTrade[]> {
  try {
    const { forexArbTradeListSchema } = await import("@/features/forex-arb/forex-arb.schema");
    return await apiClient(kyServer, API_ENDPOINTS.forexArb.listarTrades, forexArbTradeListSchema);
  } catch {
    return [];
  }
}

/**
 * Busca o saldo real da conta cTrader (GET /forex-arb/balance).
 */
export async function buscarSaldoForex(): Promise<number | null> {
  try {
    const { forexBalanceSchema } = await import("@/features/forex-arb/forex-arb.schema");
    const data = await apiClient(kyServer, API_ENDPOINTS.forexArb.balance, forexBalanceSchema);
    return data?.balance ?? null;
  } catch {
    return null;
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
      timeout: 45000,
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
 * Marca a posição Forex como encerrada administrativamente (sem ordens reais).
 */
export async function voidClosePosicao(strategyId: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.voidClose, undefined, {
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
 * Encerra TODAS as posições abertas no Forex (POST /forex-arb/close-all).
 */
export async function fecharTodasPosicoes(botType?: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.fecharTodas, undefined, {
      method: "post",
      json: { type: botType },
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
export async function deletarTodasOperacoes(botType?: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.forexArb.limparTrades, undefined, {
      method: "delete",
      searchParams: botType ? { type: botType } : undefined,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/forex-arb");
  return { ok: true };
}

/**
 * Busca trades por período no robô Pepperstone Forex.
 */
export async function buscarTradesPorPeriodo(
  periodo: string,
  symbol?: string,
): Promise<{ ok: true; data: readonly ForexArbTrade[] } | { ok: false; erro: string }> {
  try {
    const searchParams: Record<string, string> = { periodo };
    if (symbol) searchParams.symbol = symbol;

    const res = await kyServer
      .get(API_ENDPOINTS.forexArb.listarTrades, { searchParams })
      .json<{ success: boolean; data: ForexArbTrade[] }>();

    return { ok: true, data: res.data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Busca o status do modelo de IA Meta-Labeling da Pepperstone (scalping).
 */
export async function buscarStatusIaPepperstone(
  botType: "scalping" = "scalping"
): Promise<{ ok: true; data: ForexArbAiStatus } | { ok: false; erro: string }> {
  try {
    const res = await kyServer
      .get(API_ENDPOINTS.forexArb.aiStatus, { searchParams: { botType } })
      .json<{ ok: boolean; data: ForexArbAiStatus }>();
    return { ok: true, data: res.data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Treina o cérebro de IA Meta-Labeling da Pepperstone (scalping).
 */
export async function treinarIaPepperstone(
  botType: "scalping" = "scalping"
): Promise<{ ok: true; message: string; metadata?: ForexArbAiMetadata } | { ok: false; erro: string }> {
  try {
    const res = await kyServer
      .post(API_ENDPOINTS.forexArb.aiTrain, { json: { botType } })
      .json<{ ok: boolean; message: string; metadata?: ForexArbAiMetadata }>();
    revalidatePath("/dashboard/forex-arb");
    return { ok: true, message: res.message, metadata: res.metadata };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      try {
        const body = await (error as { response: Response }).response.json();
        if (body?.error) return { ok: false, erro: body.error };
      } catch {
        // fallback
      }
    }
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}
