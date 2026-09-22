"use server";

import { revalidatePath } from "next/cache";

import {
  derivBalanceSchema,
  derivLogsSchema,
  derivStrategyListSchema,
  derivStrategySchema,
  derivTradeListSchema,
  type AtualizarDerivSettingsInput,
  type AtualizarDerivStrategyInput,
  type CriarDerivStrategyInput,
  type DerivBalance,
  type DerivStrategy,
  type DerivTrade,
} from "@/features/deriv/deriv.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

export type MutacaoResult = { ok: true } | { ok: false; erro: string };

const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente.";

export type DerivPeriod = "5m" | "10m" | "30m" | "1h" | "2h" | "3h" | "4h" | "5h" | "12h" | "24h" | "today" | "7d" | "30d" | "all";



export async function buscarTradesDerivPorPeriodo(
  period: DerivPeriod = "today"
): Promise<{ ok: true; data: DerivTrade[] } | { ok: false; erro: string }> {

  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.deriv.listarTrades, derivTradeListSchema, {
      method: "get",
      searchParams: { period },
    });
    return { ok: true, data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function listarDerivStrategies(): Promise<{ ok: true; data: DerivStrategy[] } | { ok: false; erro: string }> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.deriv.strategies, derivStrategyListSchema, {
      method: "get",
    });
    return { ok: true, data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function criarDerivStrategy(input: CriarDerivStrategyInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.deriv.strategies, undefined, {
      method: "post",
      json: input,
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function atualizarDerivStrategy(input: AtualizarDerivStrategyInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, `${API_ENDPOINTS.deriv.strategies}/${input.id}`, undefined, {
      method: "put",
      json: input,
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function deletarDerivStrategy(id: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, `${API_ENDPOINTS.deriv.strategies}/${id}`, undefined, {
      method: "delete",
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function toggleDerivStrategy(id: string, active: boolean): Promise<MutacaoResult> {
  return atualizarDerivStrategy({ id, active });
}

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

export async function limparHistoricoDeriv(): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.deriv.limparTrades, undefined, {
      method: "delete",
    });
    revalidatePath("/dashboard/deriv");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

export async function buscarSaldoDeriv(): Promise<{ ok: true; data: DerivBalance } | { ok: false; erro: string }> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.deriv.balance, derivBalanceSchema, {
      method: "get",
    });
    return { ok: true, data };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : ERRO_INESPERADO,
    };
  }
}

export type DerivContractOption = {
  contractCategory: string;
  contractType: string;
  contractDisplay: string;
  minDuration: string;
  maxDuration: string;
  barriers: number;
  defaultBarrier?: string;
};

export async function buscarContratosDisponiveisDeriv(
  symbol: string
): Promise<{ ok: true; data: DerivContractOption[] } | { ok: false; erro: string }> {
  try {
    const res = await apiClient(
      kyServer,
      API_ENDPOINTS.deriv.contractsFor,
      undefined,
      {
        method: "get",
        searchParams: { symbol },
      }
    );
    return { ok: true, data: (res as any)?.data || [] };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : ERRO_INESPERADO,
    };
  }
}


export type DerivBarrierRangeData = {
  symbol: string;
  durationSec: number;
  higher: { min: string; max: string; default: string; validList: string[] };
  lower: { min: string; max: string; default: string; validList: string[] };
};

export async function buscarFaixaBarreiraDeriv(
  symbol: string,
  durationSec: number
): Promise<{ ok: true; data: DerivBarrierRangeData } | { ok: false; erro: string }> {
  try {
    const res = await apiClient(
      kyServer,
      API_ENDPOINTS.deriv.barrierRange,
      undefined,
      {
        method: "get",
        searchParams: { symbol, durationSec },
      }
    );
    return { ok: true, data: (res as any)?.data };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : ERRO_INESPERADO,
    };
  }
}


export async function testarPropostaDeriv(params: {
  symbol: string;
  contractType: string;
  durationSec: number;
  barrier?: string;
  amount?: number;
}): Promise<{ ok: true; data: any } | { ok: false; erro: string }> {
  try {
    const res = await apiClient(
      kyServer,
      API_ENDPOINTS.deriv.proposal,
      undefined,
      {
        method: "post",
        json: params,
      }
    );
    if ((res as any)?.success === false) {
      return { ok: false, erro: (res as any)?.error || "Contrato indisponível" };
    }
    return { ok: true, data: (res as any)?.data };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : ERRO_INESPERADO,
    };
  }
}

export type DerivLogsResult = { ok: true; logs: string[] } | { ok: false; erro: string };

export async function buscarLogsDeriv(lines = 150): Promise<DerivLogsResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.deriv.logs, derivLogsSchema, {
      method: "get",
      searchParams: { lines },
    });
    return { ok: true, logs: data.logs };
  } catch (error: unknown) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : ERRO_INESPERADO,
    };
  }
}

