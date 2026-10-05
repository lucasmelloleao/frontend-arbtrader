"use server";

import { revalidatePath } from "next/cache";
import type {
  FxProSettings,
  FxProStrategy,
  FxProTrade,
  FxProMetaModelStatus,
} from "@/features/fxpro/fxpro.schema";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

export type MutacaoResult = { ok: true } | { ok: false; erro: string };

const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente.";

/**
 * Busca as configurações globais do robô FxPro.
 */
export async function buscarFxProSettings(): Promise<
  { ok: true; settings: FxProSettings } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer
      .get(API_ENDPOINTS.fxpro.settings)
      .json<{ ok: boolean; settings: FxProSettings }>();
    return { ok: true, settings: res.settings };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Salva as configurações globais do robô FxPro.
 */
export async function salvarFxProSettings(dados: Partial<FxProSettings>): Promise<MutacaoResult> {
  try {
    await kyServer.post(API_ENDPOINTS.fxpro.settings, { json: dados }).json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}

/**
 * Busca a lista de estratégias da FxPro.
 */
export async function buscarEstrategiasFxPro(): Promise<
  { ok: true; strategies: FxProStrategy[] } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer
      .get(API_ENDPOINTS.fxpro.strategies)
      .json<{ ok: boolean; strategies: FxProStrategy[] }>();
    return { ok: true, strategies: res.strategies };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Cria uma nova estratégia FxPro.
 */
export async function criarEstrategiaFxPro(dados: Partial<FxProStrategy>): Promise<MutacaoResult> {
  try {
    await kyServer.post(API_ENDPOINTS.fxpro.strategies, { json: dados }).json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}

/**
 * Atualiza uma estratégia FxPro existente.
 */
export async function atualizarEstrategiaFxPro(
  id: string,
  dados: Partial<FxProStrategy>,
): Promise<MutacaoResult> {
  try {
    await kyServer.put(`${API_ENDPOINTS.fxpro.strategies}/${id}`, { json: dados }).json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}

/**
 * Deleta uma estratégia FxPro.
 */
export async function deletarEstrategiaFxPro(id: string): Promise<MutacaoResult> {
  try {
    await kyServer.delete(`${API_ENDPOINTS.fxpro.strategies}/${id}`).json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}

/**
 * Alterna status ativo/pausado de uma estratégia.
 */
export async function alternarEstrategiaFxPro(id: string): Promise<MutacaoResult> {
  try {
    await kyServer.post(API_ENDPOINTS.fxpro.toggle(id)).json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}

export type FxProPeriod =
  | "5m"
  | "10m"
  | "30m"
  | "1h"
  | "2h"
  | "3h"
  | "5h"
  | "12h"
  | "24h"
  | "today"
  | "7d"
  | "30d"
  | "all";

/**
 * Busca trades FxPro por período.
 */
export async function buscarTradesFxPro(
  opts: {
    periodo?: FxProPeriod;
    symbol?: string;
  } = {},
): Promise<{ ok: true; trades: FxProTrade[] } | { ok: false; erro: string }> {
  try {
    const searchParams: Record<string, string> = {};
    if (opts.periodo) searchParams.periodo = opts.periodo;
    if (opts.symbol) searchParams.symbol = opts.symbol;

    const res = await kyServer
      .get(API_ENDPOINTS.fxpro.trades, { searchParams })
      .json<{ ok: boolean; trades: FxProTrade[] }>();
    return { ok: true, trades: res.trades };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Busca o status da IA Meta-Labeling da FxPro.
 */
export async function buscarStatusMetaLabelingFxPro(): Promise<
  { ok: true; data: FxProMetaModelStatus } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer
      .get(API_ENDPOINTS.fxpro.metaModelStatus)
      .json<{ ok: boolean; data: FxProMetaModelStatus }>();
    return { ok: true, data: res.data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Dispara treinamento do modelo da IA FxPro.
 */
export async function treinarModeloMetaLabelingFxPro(): Promise<
  { ok: true; message: string } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer
      .post(API_ENDPOINTS.fxpro.metaModelTrain)
      .json<{ ok: boolean; message: string }>();
    revalidatePath("/dashboard/fxpro");
    return { ok: true, message: res.message || "IA FxPro treinada com sucesso!" };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Busca logs do robô FxPro cTrader.
 */
export async function buscarLogsFxPro(
  lines: number = 150,
): Promise<{ ok: true; logs: string[] } | { ok: false; erro: string }> {
  try {
    const res = await kyServer
      .get(API_ENDPOINTS.fxpro.logs, {
        searchParams: { lines: String(lines) },
      })
      .json<
        | { linesCount: number; logs: string[]; timestamp: string }
        | { success: boolean; data: { logs: string[] } }
      >();

    if ("logs" in res && Array.isArray(res.logs)) {
      return { ok: true, logs: res.logs };
    }
    if ("data" in res && Array.isArray(res.data.logs)) {
      return { ok: true, logs: res.data.logs };
    }
    return { ok: true, logs: [] };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export type FxProBalanceInfo = {
  balance: number;
  equity: number;
  leverage: number;
  currency: string;
  accountType: string;
  accountId?: string;
};

/**
 * Busca o saldo e métricas da conta cTrader FxPro.
 */
export async function buscarSaldoFxPro(): Promise<
  { ok: true; data: FxProBalanceInfo } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer
      .get(API_ENDPOINTS.fxpro.balance)
      .json<{ ok: boolean; data: FxProBalanceInfo }>();
    return { ok: true, data: res.data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Encerra uma posição a mercado na cTrader.
 */
export async function fecharPosicaoFxPro(
  positionId: string,
  symbol?: string,
): Promise<MutacaoResult> {
  try {
    await kyServer
      .post(API_ENDPOINTS.fxpro.close, {
        json: { positionId, symbol },
      })
      .json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}
