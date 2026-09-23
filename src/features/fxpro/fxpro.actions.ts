"use server";

import { revalidatePath } from "next/cache";
import {
  type FxProSettings,
  type FxProStrategy,
  type FxProTrade,
  type FxProMetaModelStatus,
} from "@/features/fxpro/fxpro.schema";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

export type MutacaoResult = { ok: true } | { ok: false; erro: string };

const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente.";

/**
 * Busca as configurações globais do robô FxPro.
 */
export async function buscarFxProSettings(): Promise<{ ok: true; settings: FxProSettings } | { ok: false; erro: string }> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.fxpro.settings).json<{ ok: boolean; settings: FxProSettings }>();
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
export async function buscarEstrategiasFxPro(): Promise<{ ok: true; strategies: FxProStrategy[] } | { ok: false; erro: string }> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.fxpro.strategies).json<{ ok: boolean; strategies: FxProStrategy[] }>();
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

/**
 * Busca trades FxPro por período.
 */
export async function buscarTradesFxPro(opts: {
  periodo?: "today" | "7d" | "30d" | "all";
  symbol?: string;
} = {}): Promise<{ ok: true; trades: FxProTrade[] } | { ok: false; erro: string }> {
  try {
    const searchParams: Record<string, string> = {};
    if (opts.periodo) searchParams.periodo = opts.periodo;
    if (opts.symbol) searchParams.symbol = opts.symbol;

    const res = await kyServer.get(API_ENDPOINTS.fxpro.trades, { searchParams }).json<{ ok: boolean; trades: FxProTrade[] }>();
    return { ok: true, trades: res.trades };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Inicia ou pausa o motor da FxPro.
 */
export async function alternarMotorFxPro(start: boolean): Promise<MutacaoResult> {
  try {
    const endpoint = start ? API_ENDPOINTS.fxpro.botStart : API_ENDPOINTS.fxpro.botStop;
    await kyServer.post(endpoint).json();
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/fxpro");
  return { ok: true };
}

/**
 * Busca o status da IA Meta-Labeling da FxPro.
 */
export async function buscarStatusMetaLabelingFxPro(): Promise<
  { ok: true; data: FxProMetaModelStatus } | { ok: false; erro: string }
> {
  try {
    const res = await kyServer.get(API_ENDPOINTS.fxpro.metaModelStatus).json<{ ok: boolean; data: FxProMetaModelStatus }>();
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
    const res = await kyServer.post(API_ENDPOINTS.fxpro.metaModelTrain).json<{ ok: boolean; message: string }>();
    revalidatePath("/dashboard/fxpro");
    return { ok: true, message: res.message || "IA FxPro treinada com sucesso!" };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}
