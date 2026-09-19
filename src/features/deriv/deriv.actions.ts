"use server";

import { revalidatePath } from "next/cache";

import type { AtualizarDerivSettingsInput } from "@/features/deriv/deriv.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

export type MutacaoResult = { ok: true } | { ok: false; erro: string };

const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente.";

export async function salvarDerivSettings(
  input: AtualizarDerivSettingsInput,
): Promise<{ ok: boolean; erro: string }> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.deriv.settings, undefined, {
      method: "post",
      json: input,
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true, erro: "" };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function fecharPosicaoDeriv(tradeId: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.deriv.close, undefined, {
      method: "post",
      json: { tradeId },
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function syncTradesDeriv(): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.deriv.sync, undefined, {
      method: "post",
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}
