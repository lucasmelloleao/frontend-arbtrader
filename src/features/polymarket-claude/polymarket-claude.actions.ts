"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";
import {
  polymarketClaudeBotStatusSchema,
  polymarketClaudeLogsSchema,
  polymarketClaudeSettingsSchema,
  polymarketClaudeStrategyListSchema,
  polymarketClaudeTradeListSchema,
  polymarketClaudeTradesSummarySchema,
  type PolymarketClaudeBotStatus,
  type PolymarketClaudeSettings,
  type PolymarketClaudeStrategy,
  type PolymarketClaudeTrade,
  type PolymarketClaudeTradesSummary,
} from "./polymarket-claude.schema";

export async function salvarConfiguracoesClaude(
  dados: Partial<PolymarketClaudeSettings>
): Promise<{ sucesso: boolean; mensagem?: string }> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.polymarketClaude.settings, polymarketClaudeSettingsSchema, {
      method: "POST",
      json: dados,
    });
    revalidatePath("/dashboard/polymarket-claude");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, mensagem: erro?.message || "Falha ao salvar configurações" };
  }
}

export async function alternarIncubacaoClaude(
  isScanningEnabled: boolean,
  allowLiveTrading: boolean
): Promise<{ sucesso: boolean; mensagem?: string }> {
  return salvarConfiguracoesClaude({ isScanningEnabled, allowLiveTrading, incubateMode: true });
}

export async function criarStrategyClaude(slug: string, tradeSize = 1.0) {
  try {
    await apiClient(
      kyServer,
      API_ENDPOINTS.polymarketClaude.criarStrategy,
      polymarketClaudeSettingsSchema,
      {
        method: "POST",
        json: { slug, tradeSize, autoExecute: true, rbiStatus: "INCUBATE" },
      }
    );
    revalidatePath("/dashboard/polymarket-claude");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, mensagem: erro?.message || "Falha ao criar estratégia" };
  }
}

export async function deletarStrategyClaude(id?: string) {
  try {
    await apiClient(
      kyServer,
      id
        ? `${API_ENDPOINTS.polymarketClaude.deletarStrategy}/${id}`
        : API_ENDPOINTS.polymarketClaude.deletarStrategy,
      polymarketClaudeSettingsSchema,
      { method: "DELETE", json: id ? { id } : {} }
    );
    revalidatePath("/dashboard/polymarket-claude");
    return { sucesso: true };
  } catch (erro: any) {
    return { sucesso: false, mensagem: erro?.message || "Falha ao deletar estratégia" };
  }
}

export async function buscarTradesClaude(period = "all"): Promise<PolymarketClaudeTrade[]> {
  try {
    const res = await apiClient(
      kyServer,
      `${API_ENDPOINTS.polymarketClaude.listarTrades}?period=${period}`,
      polymarketClaudeTradeListSchema
    );
    return res;
  } catch {
    return [];
  }
}

export async function buscarLogsClaude(): Promise<string[]> {
  try {
    const res = await apiClient(
      kyServer,
      API_ENDPOINTS.polymarketClaude.logs,
      polymarketClaudeLogsSchema
    );
    return res.lines;
  } catch {
    return [];
  }
}
