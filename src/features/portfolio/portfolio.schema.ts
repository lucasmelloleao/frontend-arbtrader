import { array, type InferOutput, nullable, number, object, string } from "valibot";

/**
 * Resumo patrimonial consolidado das corretoras conectadas.
 * Fonte: GET /api/v1/portfolio/resumo (espelha o `/perp-arb/balances` legado).
 */
export const portfolioResumoSchema = object({
  spotUsdt: number(),
  spotUsdc: number(),
  spotTotalEquity: number(),
  futuresUsdt: number(),
  futuresUsdc: number(),
  futuresTotalEquity: number(),
  exchanges: array(
    object({
      id: string(),
      name: string(),
      exchangeId: string(),
      spotUsdt: number(),
      spotUsdc: number(),
      spotTotalEquity: number(),
      futuresUsdt: number(),
      futuresUsdc: number(),
      futuresTotalEquity: number(),
    }),
  ),
});

/** Saldo de uma corretora no resumo. */
export type ExchangeBalance = InferOutput<typeof portfolioResumoSchema>["exchanges"][number];

/** Resumo patrimonial tipado. */
export type PortfolioResumo = InferOutput<typeof portfolioResumoSchema>;

/**
 * Moeda spot (saldo por ativo numa corretora), do `/portfolio/live` legado.
 */
const spotCoinSchema = object({
  asset: string(),
  free: number(),
  used: number(),
  total: number(),
  usdValue: number(),
  price: nullable(number()),
  avgCostPrice: nullable(number()),
  totalCost: number(),
  totalQty: number(),
  investedValue: number(),
  pnl: number(),
  pnlPct: nullable(number()),
  exchange: string(),
});

/** Moeda spot tipada. */
export type SpotCoin = InferOutput<typeof spotCoinSchema>;

/**
 * Posição futura aberta, do `/portfolio/live` legado.
 */
const futuresPositionSchema = object({
  exchange: string(),
  symbol: string(),
  side: string(),
  contracts: number(),
  contractSize: number(),
  qty: number(),
  notional: number(),
  entryPrice: nullable(number()),
  markPrice: nullable(number()),
  liquidationPrice: nullable(number()),
  leverage: number(),
  unrealizedPnl: number(),
  unrealizedPnlPct: number(),
  margin: number(),
});

/** Posição futura tipada. */
export type FuturesPosition = InferOutput<typeof futuresPositionSchema>;

/**
 * Portfolio ao vivo: moedas spot + posições futuras + totais.
 * Fonte: GET /api/v1/portfolio/live.
 */
export const portfolioLiveSchema = object({
  spotCoins: array(spotCoinSchema),
  positions: array(futuresPositionSchema),
  spotTotalUsd: number(),
  futuresUnrealizedPnl: number(),
  timestamp: string(),
});

/**
 * Ponto do histórico de evolução patrimonial (snapshot), do
 * `/portfolio/history` legado.
 */
export const portfolioHistoricoSchema = array(
  object({
    timestamp: string(),
    totalUsdValue: number(),
    spotTotalUsd: number(),
    futuresTotalUsd: number(),
    futuresUnrealizedPnl: number(),
  }),
);

/** Histórico de evolução patrimonial tipado. */
export type PortfolioHistorico = InferOutput<typeof portfolioHistoricoSchema>;
