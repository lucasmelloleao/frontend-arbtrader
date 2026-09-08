"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";
import {
  latencyLogsSchema,
  latencySettingsSchema,
  latencyTradeListSchema,
  type LatencySettings,
  type LatencyTrade,
} from "@/features/latency-arb/latency-arb.schema";

export async function buscarLatencySettings(): Promise<LatencySettings | null> {
  try {
    const res = await apiClient(
      kyServer,
      API_ENDPOINTS.latencyArb.settings,
      latencySettingsSchema,
      {
        method: "get",
      },
    );
    return res;
  } catch (err) {
    console.error("Erro ao buscar latency settings:", err);
  }
  return {
    isScanningEnabled: false,
    tradeSize: 100,
    minTriggerPips: 1.5,
    maxLagMs: 500,
    minProfitUsd: 0.1,
    maxDailyLoss: 10,
    autoExecute: false,
    takeProfitPct: 0.5,
    stopLossPct: 0.3,
    trailingStopPct: 0.2,
    allowedSymbols: ["EUR/USD"],
  };
}

export async function atualizarLatencySettings(
  entrada: Partial<LatencySettings>,
): Promise<{ ok: boolean; erro?: string }> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.latencyArb.settings, undefined, {
      method: "post",
      json: entrada,
    });
    revalidatePath("/dashboard/latency-arb");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : "Erro ao atualizar" };
  }
}

export async function buscarLatencyTrades(): Promise<LatencyTrade[]> {
  try {
    return await apiClient(kyServer, API_ENDPOINTS.latencyArb.trades, latencyTradeListSchema, {
      method: "get",
    });
  } catch {
    return [];
  }
}

export async function fecharLatencyTrade(id: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.latencyArb.close, undefined, {
      method: "post",
      json: { id },
    });
    revalidatePath("/dashboard/latency-arb");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : "Erro ao fechar" };
  }
}

export async function buscarLatencyLogs(): Promise<
  { ok: true; logs: string[] } | { ok: false; erro: string }
> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.latencyArb.logs, latencyLogsSchema, {
      method: "get",
    });
    return { ok: true, logs: data.logs };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro ao buscar logs de latência",
    };
  }
}
