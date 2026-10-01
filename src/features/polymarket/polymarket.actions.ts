"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

export type PolymarketResult = { ok: true; data?: unknown } | { ok: false; erro: string };

const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente.";

/** Salva as credenciais Polymarket (relayer key, deposit wallet, clob creds). */
export async function salvarCredenciaisPolymarket(credenciais: {
  apiKey?: string;
  apiSecret?: string;
  relayerApiKey?: string;
  relayerApiKeyAddress?: string;
  depositWallet?: string;
  clobApiKey?: string;
  clobSecret?: string;
  clobPassphrase?: string;
}): Promise<PolymarketResult> {
  try {
    const corpo: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(credenciais)) {
      if (typeof valor === "string" && valor.trim() !== "") corpo[chave] = valor.trim();
    }
    await apiClient(kyServer, API_ENDPOINTS.polymarket.credentials, undefined, {
      method: "post",
      json: corpo,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Sincroniza o saldo pUSD (EOA e deposit wallet) via on-chain. */
export async function sincronizarSaldoPolymarket(): Promise<PolymarketResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.polymarket.balance, undefined, {
      method: "get",
    });
    revalidatePath("/dashboard/polymarket-arb");
    return { ok: true, data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/** Transfere pUSD da wallet EOA para a deposit wallet (gas pago em MATIC da EOA). */
export async function transferirPusdPolymarket(amount?: number): Promise<PolymarketResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.polymarket.transfer, undefined, {
      method: "post",
      json: amount && amount > 0 ? { amount } : {},
    });
    revalidatePath("/dashboard");
    return { ok: true, data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/** Faz o deploy da deposit wallet via relayer. */
export async function deployDepositWalletPolymarket(): Promise<PolymarketResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.polymarket.deployWallet, undefined, {
      method: "post",
    });
    revalidatePath("/dashboard");
    return { ok: true, data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/** Sincroniza o histórico de operações da Polymarket para o banco. */
export async function sincronizarHistoricoPolymarket(): Promise<PolymarketResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.polymarket.syncHistory, undefined, {
      method: "post",
    });
    revalidatePath("/dashboard");
    return { ok: true, data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}
