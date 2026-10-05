"use server";

import { revalidatePath } from "next/cache";
import type {
  IcMarketsAiMetadata,
  IcMarketsBalance,
  IcMarketsSettings,
  IcMarketsStrategy,
  IcMarketsTrade,
} from "@/features/icmarkets/icmarkets.schema";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

export type IcMarketsPeriod = "1h" | "24h" | "today" | "7d" | "30d";

const ERRO_INESPERADO = "Não foi possível concluir. Tente novamente.";

export async function buscarTradesIcMarkets(filtros?: {
  periodo?: IcMarketsPeriod;
  symbol?: string;
  status?: string;
}): Promise<{ ok: true; trades: readonly IcMarketsTrade[] } | { ok: false; erro: string }> {
  try {
    const searchParams: Record<string, string> = {};
    if (filtros?.periodo) searchParams.periodo = filtros.periodo;
    if (filtros?.symbol) searchParams.symbol = filtros.symbol;
    if (filtros?.status) searchParams.status = filtros.status;

    const res = await kyServer.get(API_ENDPOINTS.icmarkets.trades, { searchParams }).json<{
      ok: boolean;
      trades: IcMarketsTrade[];
    }>();

    return { ok: true, trades: res.trades };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function buscarEstrategiasIcMarkets(): Promise<
  { ok: true; strategies: readonly IcMarketsStrategy[] } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.icmarkets.strategies).json<{
      ok: boolean;
      strategies: IcMarketsStrategy[];
    }>();
    return { ok: true, strategies: res.strategies };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function buscarSettingsIcMarkets(): Promise<
  { ok: true; settings: IcMarketsSettings } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.icmarkets.settings).json<{
      ok: boolean;
      settings: IcMarketsSettings;
    }>();
    return { ok: true, settings: res.settings };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function buscarStatusIa(): Promise<
  { ok: true; metadata: IcMarketsAiMetadata | null } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.icmarkets.metaModelStatus).json<{
      ok: boolean;
      metadata: IcMarketsAiMetadata | null;
    }>();
    return { ok: true, metadata: res.metadata };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function salvarConfiguracoesIcMarkets(
  settings: Partial<IcMarketsSettings>,
): Promise<{ ok: true; settings: IcMarketsSettings } | { ok: false; erro: string }> {
  try {
    const res = await kyServer.post(API_ENDPOINTS.icmarkets.settings, { json: settings }).json<{
      ok: boolean;
      settings: IcMarketsSettings;
    }>();

    revalidatePath("/dashboard/icmarkets");
    return { ok: true, settings: res.settings };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function criarEstrategiaIcMarkets(
  payload: Partial<IcMarketsStrategy>,
): Promise<{ ok: true; strategy: IcMarketsStrategy } | { ok: false; erro: string }> {
  try {
    const res = await kyServer.post(API_ENDPOINTS.icmarkets.strategies, { json: payload }).json<{
      ok: boolean;
      strategy: IcMarketsStrategy;
    }>();

    revalidatePath("/dashboard/icmarkets");
    return { ok: true, strategy: res.strategy };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function atualizarEstrategiaIcMarkets(
  id: string,
  payload: Partial<IcMarketsStrategy>,
): Promise<{ ok: true; strategy: IcMarketsStrategy } | { ok: false; erro: string }> {
  try {
    const res = await kyServer.put(`api/v1/icmarkets/strategies/${id}`, { json: payload }).json<{
      ok: boolean;
      strategy: IcMarketsStrategy;
    }>();

    revalidatePath("/dashboard/icmarkets");
    return { ok: true, strategy: res.strategy };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function deletarEstrategiaIcMarkets(
  id: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    await kyServer.delete(`api/v1/icmarkets/strategies/${id}`).json();
    revalidatePath("/dashboard/icmarkets");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function alternarEstrategiaIcMarkets(
  id: string,
): Promise<{ ok: true; strategy: IcMarketsStrategy } | { ok: false; erro: string }> {
  try {
    const res = await kyServer.post(API_ENDPOINTS.icmarkets.toggle(id)).json<{
      ok: boolean;
      strategy: IcMarketsStrategy;
    }>();

    revalidatePath("/dashboard/icmarkets");
    return { ok: true, strategy: res.strategy };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function alternarRoboIcMarkets(
  ligar: boolean,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const endpoint = ligar ? API_ENDPOINTS.icmarkets.botStart : API_ENDPOINTS.icmarkets.botStop;
    await kyServer.post(endpoint).json();
    revalidatePath("/dashboard/icmarkets");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function treinarIaIcMarkets(): Promise<
  { ok: true; metadata: IcMarketsAiMetadata; message: string } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.post(API_ENDPOINTS.icmarkets.metaModelTrain).json<{
      ok: boolean;
      message: string;
      metadata: IcMarketsAiMetadata;
    }>();

    revalidatePath("/dashboard/icmarkets");
    return { ok: true, metadata: res.metadata, message: res.message };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function buscarLogsIcMarkets(): Promise<
  { ok: true; logs: readonly string[] } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.icmarkets.logs).json<{
      ok: boolean;
      logs: string[];
    }>();
    return { ok: true, logs: res.logs };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function buscarSaldoIcMarkets(): Promise<
  { ok: true; balance: IcMarketsBalance } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.icmarkets.balance).json<{
      ok: boolean;
      balance: IcMarketsBalance;
    }>();
    return { ok: true, balance: res.balance };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function fecharPosicaoIcMarkets(
  strategyId: string,
  positionId?: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    await kyServer.post(API_ENDPOINTS.icmarkets.close, { json: { strategyId, positionId } }).json();
    revalidatePath("/dashboard/icmarkets");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}
