"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";
import {
  polymarketClaudeLogsSchema,
  polymarketClaudeSettingsSchema,
  polymarketClaudeTradeListSchema,
  type PolymarketClaudeSettings,
  type PolymarketClaudeTrade,
} from "@/features/polymarket-claude/polymarket-claude.schema";

export async function salvarConfiguracoesClaude(
  dados: Partial<PolymarketClaudeSettings>,
): Promise<{ sucesso: boolean; mensagem?: string }> {
  try {
    await apiClient(
      kyServer,
      API_ENDPOINTS.polymarketClaude.settings,
      polymarketClaudeSettingsSchema,
      {
        method: "POST",
        json: dados,
      },
    );
    revalidatePath("/dashboard/polymarket-claude");
    return { sucesso: true };
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : "Falha ao salvar configurações";
    return { sucesso: false, mensagem: msg };
  }
}

export async function alternarIncubacaoClaude(
  isScanningEnabled: boolean,
  allowLiveTrading: boolean,
): Promise<{ sucesso: boolean; mensagem?: string }> {
  return salvarConfiguracoesClaude({ isScanningEnabled, allowLiveTrading, incubateMode: true });
}

export async function criarStrategyClaude(
  slug: string,
  tradeSize = 1.0,
): Promise<{ sucesso: boolean; mensagem?: string }> {
  try {
    await apiClient(
      kyServer,
      API_ENDPOINTS.polymarketClaude.criarStrategy,
      polymarketClaudeSettingsSchema,
      {
        method: "POST",
        json: { slug, tradeSize, autoExecute: true, rbiStatus: "INCUBATE" },
      },
    );
    revalidatePath("/dashboard/polymarket-claude");
    return { sucesso: true };
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : "Falha ao criar estratégia";
    return { sucesso: false, mensagem: msg };
  }
}

export async function deletarStrategyClaude(
  id?: string,
): Promise<{ sucesso: boolean; mensagem?: string }> {
  try {
    await apiClient(
      kyServer,
      id
        ? `${API_ENDPOINTS.polymarketClaude.deletarStrategy}/${id}`
        : API_ENDPOINTS.polymarketClaude.deletarStrategy,
      polymarketClaudeSettingsSchema,
      { method: "DELETE", json: id ? { id } : {} },
    );
    revalidatePath("/dashboard/polymarket-claude");
    return { sucesso: true };
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : "Falha ao deletar estratégia";
    return { sucesso: false, mensagem: msg };
  }
}

export async function buscarTradesClaude(period = "all"): Promise<PolymarketClaudeTrade[]> {
  try {
    const res = await apiClient(
      kyServer,
      `${API_ENDPOINTS.polymarketClaude.listarTrades}?period=${period}`,
      polymarketClaudeTradeListSchema,
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
      polymarketClaudeLogsSchema,
    );
    return res.lines;
  } catch {
    return [];
  }
}
