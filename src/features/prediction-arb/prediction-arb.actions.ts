"use server";

import { revalidatePath } from "next/cache";

import {
  type AtualizarPredictionSettingsInput,
  type CriarPredictionStrategyInput,
  predictionArbLogsSchema,
} from "@/features/prediction-arb/prediction-arb.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/** Resultado padrão de mutação. */
export type MutacaoResult = { ok: true } | { ok: false; erro: string };

const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente.";

/**
 * Salva as configurações do robô de Prediction Market (POST /prediction-arb/settings).
 */
export async function salvarSettings(
  entrada: AtualizarPredictionSettingsInput,
): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.settings, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Cria uma nova estratégia de Prediction Market por slug (POST /prediction-arb/strategies).
 */
export async function criarStrategy(entrada: CriarPredictionStrategyInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.criarStrategy, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Fecha uma posição de Prediction Market (POST /prediction-arb/close).
 */
export async function fecharPosicao(strategyId: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.fechar, undefined, {
      method: "post",
      json: { strategyId },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Aumenta o aporte em uma posição (POST /prediction-arb/increase).
 */
export async function aumentarAporte(strategyId: string, amount: number): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.aumentar, undefined, {
      method: "post",
      json: { strategyId, amount },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Marca como encerrada sem execução (POST /prediction-arb/void-close).
 */
export async function voidCloseStrategy(strategyId: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.voidClose, undefined, {
      method: "post",
      json: { strategyId },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Deleta uma estratégia inativa (DELETE /prediction-arb/strategies).
 */
export async function deletarStrategy(id: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.deletarStrategy, undefined, {
      method: "delete",
      searchParams: { id },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Alterna o modo de colheita do robô (LIVE = ordens reais vs dry-run).
 * O valor é persistido no banco (PredictionArbSettings.allowLiveTrading),
 * sem depender de variável de ambiente no servidor.
 */
export async function alternarColheita(live: boolean): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.settings, undefined, {
      method: "post",
      json: { allowLiveTrading: live },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/**
 * Dispara um scan manual de mercados na Gamma API (GET /prediction-arb/manual-scan).
 */
export async function executarManualScan(): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.predictionArb.manualScan, undefined, {
      method: "get",
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/polymarket-arb");
  return { ok: true };
}

/** Linhas de log do robô prediction-arb. */
export type PredictionLogsResult = { ok: true; logs: string[] } | { ok: false; erro: string };

/**
 * Busca as linhas de log do robô Polymarket (GET /prediction-arb/logs).
 */
export async function buscarLogsPrediction(lines = 150): Promise<PredictionLogsResult> {
  try {
    const data = await apiClient(
      kyServer,
      API_ENDPOINTS.predictionArb.logs,
      predictionArbLogsSchema,
      {
        method: "get",
        searchParams: { process: "prediction-arb", lines },
      },
    );
    return { ok: true, logs: data.logs };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : ERRO_INESPERADO,
    };
  }
}
