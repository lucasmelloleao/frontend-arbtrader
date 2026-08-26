"use server";

import { revalidatePath } from "next/cache";

import type {
  AtualizarSettingsInput,
  AtualizarStrategyInput,
  BotStatus,
  CriarStrategyInput,
  PerpArbAuditExchange,
} from "@/features/perp-arb/perp-arb.schema";
import {
  botStatusSchema,
  perpArbAuditExchangeSchema,
  perpArbLogsSchema,
  portfolioLiveLocalSchema,
} from "@/features/perp-arb/perp-arb.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/** Resultado padrão de mutação. */
export type MutacaoResult = { ok: true } | { ok: false; erro: string };

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível concluir. Tente novamente.";

/** Portfolio ao vivo (data do GET /portfolio/live). */
export type PortfolioLiveResult =
  | {
      ok: true;
      dados: {
        positions: {
          symbol: string;
          entryPrice: number | null;
          markPrice: number | null;
          bidPrice: number | null;
          askPrice: number | null;
          liquidationPrice: number | null;
          leverage: number;
          unrealizedPnl: number;
          spotSymbol?: string | null;
        }[];
        spotCoins: {
          asset: string;
          price: number | null;
          bidPrice: number | null;
          askPrice: number | null;
        }[];
      };
    }
  | { ok: false; erro: string };

/**
 * Busca o portfolio AO VIVO (posições e moedas spot) no backend. O backend
 * consulta as corretoras na hora (fetchTicker/fetchPositions) — não usa banco.
 */
export async function buscarPortfolioLive(): Promise<PortfolioLiveResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.portfolio.live, portfolioLiveLocalSchema, {
      method: "get",
    });
    return {
      ok: true,
      dados: {
        positions: data.positions.map((p) => ({
          symbol: p.symbol,
          entryPrice: p.entryPrice,
          markPrice: p.markPrice,
          bidPrice: p.bidPrice,
          askPrice: p.askPrice,
          liquidationPrice: p.liquidationPrice,
          leverage: p.leverage,
          unrealizedPnl: p.unrealizedPnl,
          spotSymbol: p.spotSymbol,
        })),
        spotCoins: data.spotCoins.map((c) => ({
          asset: c.asset,
          price: c.price,
          bidPrice: c.bidPrice,
          askPrice: c.askPrice,
        })),
      },
    };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Cria uma nova estratégia de arbitragem.
 *
 * @param entrada - Campos da estratégia.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function criarStrategy(entrada: CriarStrategyInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.criarStrategy, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/**
 * Atualiza uma estratégia existente.
 *
 * @param entrada - Campos da estratégia (inclui `id`).
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function atualizarStrategy(entrada: AtualizarStrategyInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.atualizarStrategy, undefined, {
      method: "put",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/**
 * Remove uma estratégia pelo id.
 *
 * @param id - Id da estratégia.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function deletarStrategy(id: string): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.deletarStrategy, undefined, {
      method: "delete",
      searchParams: { id },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/**
 * Aciona o fechamento de uma estratégia (vende spot + recompra perp).
 *
 * @param strategyId - Id da estratégia.
 * @param perpSymbol - Símbolo do perpétuo.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function fecharStrategy(
  strategyId: string,
  perpSymbol: string,
): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.fechar, undefined, {
      method: "post",
      json: { strategyId, perpSymbol },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/**
 * Aumenta o aporte de uma estratégia ativa.
 *
 * @param strategyId - Id da estratégia.
 * @param amount - Valor extra em USDT.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function aumentarAporte(strategyId: string, amount: number): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.aumentar, undefined, {
      method: "post",
      json: { strategyId, amount },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/**
 * Marca a posição como encerrada pela corretora (sem ordens reais).
 *
 * @param strategyId - Id da estratégia.
 * @param perpSymbol - Símbolo do perpétuo.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function voidCloseStrategy(
  strategyId: string,
  perpSymbol: string,
): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.voidClose, undefined, {
      method: "post",
      json: { strategyId, perpSymbol },
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/**
 * Atualiza as configurações globais do robô.
 *
 * @param entrada - Configurações editáveis.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function atualizarSettings(entrada: AtualizarSettingsInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perpArb.settings, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/perpetual-arb");
  return { ok: true };
}

/** Linhas de log do robô (data do GET /perp-arb/logs). */
export type LogsResult = { ok: true; logs: string[] } | { ok: false; erro: string };

/**
 * Busca os logs de execução do robô.
 *
 * @param process - Processo (`scanner` ou `funding-arb`).
 * @param lines - Quantidade de linhas.
 * @returns Lista de linhas de log ou erro.
 */
export async function buscarLogs(process: string, lines: number): Promise<LogsResult> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.perpArb.logs, perpArbLogsSchema, {
      method: "get",
      searchParams: { process, lines: String(lines) },
    });
    return { ok: true, logs: data.logs };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Busca o status de operação do robô (heartbeat + estado do scanner).
 *
 * @returns `{ ok: true, dados: BotStatus }` ou `{ ok: false, erro }`.
 */
export async function buscarBotStatus(): Promise<
  { ok: true; dados: BotStatus; erro?: never } | { ok: false; erro: string; dados?: never }
> {
  try {
    const data = await apiClient(kyServer, API_ENDPOINTS.perpArb.botStatus, botStatusSchema, {
      method: "get",
    });
    return { ok: true, dados: data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/** Resultado da auditoria de trades da corretora. */
export type AuditExchangeResult =
  | { ok: true; dados: PerpArbAuditExchange; erro?: never }
  | { ok: false; erro: string; dados?: never };

/**
 * Busca o relatório de auditoria de trades reais da corretora (Spot +
 * Perpétuo, taxas e lucro/prejuízo) no GET `/perp-arb/audit-exchange`.
 *
 * A auditoria cruza trades reais de vários dias (várias chamadas à exchange),
 * então usa um timeout maior que o padrão de 10s do ky.
 *
 * @param exchange - Identificador da corretora (mexc, binance, okx, bybit, gateio).
 * @param days - Quantidade de dias retroativos para auditar.
 */
export async function buscarAuditExchange(
  exchange: string,
  days: number,
): Promise<AuditExchangeResult> {
  try {
    const data = await apiClient(
      kyServer,
      API_ENDPOINTS.perpArb.auditExchange,
      perpArbAuditExchangeSchema,
      {
        method: "get",
        searchParams: { exchange, days: String(days) },
        timeout: 60000,
      },
    );
    return { ok: true, dados: data };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}
