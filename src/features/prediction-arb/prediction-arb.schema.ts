import {
  array,
  boolean,
  fallback,
  minValue,
  number,
  object,
  optional,
  pipe,
  string,
  transform,
  type InferOutput,
} from "valibot";

/** Schema de uma estratégia em Prediction Market (Polymarket). */
export const predictionArbStrategySchema = object({
  id: string(),
  nome: fallback(string(), ""),
  slug: fallback(string(), ""),
  marketId: fallback(string(), ""),
  conditionId: fallback(string(), ""),
  yesPrice: fallback(number(), 0),
  noPrice: fallback(number(), 0),
  spreadPct: fallback(number(), 0),
  tradeSize: fallback(number(), 100),
  ativo: fallback(boolean(), true),
  autoExecute: fallback(boolean(), false),
  positionOpen: fallback(boolean(), false),
  positionSize: fallback(number(), 0),
  yesShares: fallback(number(), 0),
  noShares: fallback(number(), 0),
  avgYesPrice: fallback(number(), 0),
  avgNoPrice: fallback(number(), 0),
  targetProfitPct: fallback(number(), 1.0),
  endDate: fallback(string(), ""),
  isAutoCreated: fallback(boolean(), false),
  createdAt: fallback(string(), ""),
});

export type PredictionArbStrategy = InferOutput<typeof predictionArbStrategySchema>;

/** Schema de lista de estratégias `array(predictionArbStrategySchema)` */
export const predictionArbStrategyListSchema = array(predictionArbStrategySchema);

/** Schema de uma resposta de estratégia individual */
export const predictionArbStrategyResponseSchema = predictionArbStrategySchema;

/** Schema de um trade em Prediction Market. */
export const predictionArbTradeSchema = object({
  id: string(),
  strategyId: fallback(string(), ""),
  openTradeId: fallback(string(), ""),
  marketId: fallback(string(), ""),
  slug: fallback(string(), ""),
  question: fallback(string(), ""),
  type: fallback(string(), "trade"),
  status: fallback(string(), "executed"),
  side: fallback(string(), "YES"),
  yesPrice: fallback(number(), 0),
  noPrice: fallback(number(), 0),
  yesExitPrice: fallback(number(), 0),
  noExitPrice: fallback(number(), 0),
  amount: fallback(number(), 0),
  yesShares: fallback(number(), 0),
  noShares: fallback(number(), 0),
  pnl: fallback(number(), 0),
  spreadPct: fallback(number(), 0),
  reason: fallback(string(), ""),
  orderIds: fallback(array(string()), []),
  createdAt: fallback(string(), ""),
});

export type PredictionArbTrade = InferOutput<typeof predictionArbTradeSchema>;

/** Schema de lista de trades */
export const predictionArbTradeListSchema = array(predictionArbTradeSchema);

/** Schema do resumo de trades GET /prediction-arb/trades/resumo. */
export const predictionArbTradesSummarySchema = object({
  operacoesEncerradas: fallback(number(), 0),
  totalPnl: fallback(number(), 0),
  aprPct: fallback(number(), 0),
  monthlyPct: fallback(number(), 0),
  totalEntradaUsd: fallback(number(), 0),
  totalSaidaUsd: fallback(number(), 0),
});

export type PredictionArbTradesSummary = InferOutput<typeof predictionArbTradesSummarySchema>;

/** Schema das configurações do robô GET /prediction-arb/settings. */
export const predictionArbSettingsSchema = object({
  userId: fallback(string(), ""),
  isScanningEnabled: fallback(boolean(), false),
  // Modo LIVE (ordens reais) — alternado pelo botão "Iniciar Colheita"
  allowLiveTrading: fallback(boolean(), false),
  lastScannedAt: fallback(string(), ""),
  tradeSize: fallback(number(), 100),
  minSpreadPct: fallback(number(), 0.5),
  minVolume24hUSD: fallback(number(), 10000),
  maxStrategiesPerScan: fallback(number(), 5),
  maxPortfolioCapUSD: fallback(number(), 1000),
  maxDailyLoss: fallback(number(), 10),
  makerOnly: fallback(boolean(), true),
  makerRebatePct: fallback(number(), 0),
  maxSlippagePct: fallback(number(), 0.1),
  closeWhenComplete: fallback(boolean(), true),
  targetProfitPct: fallback(number(), 1.0),
  allowedMarkets: fallback(array(string()), []),
  scanIntervalMs: fallback(number(), 60000),
});

export type PredictionArbSettings = InferOutput<typeof predictionArbSettingsSchema>;

/** Schema do status do robô GET /prediction-arb/bot-status. */
export const predictionArbBotStatusSchema = object({
  isScanningEnabled: fallback(boolean(), false),
  allowLiveTrading: fallback(boolean(), false),
  isOnline: fallback(boolean(), false),
  lastHeartbeat: fallback(string(), ""),
  botName: fallback(string(), "prediction-arb"),
});

export type PredictionArbBotStatus = InferOutput<typeof predictionArbBotStatusSchema>;

/** Input de criação manual de estratégia. */
export const criarPredictionStrategyInputSchema = object({
  slug: pipe(
    string(),
    transform((v) => v.trim()),
  ),
  tradeSize: optional(pipe(number(), minValue(1)), 100),
  autoExecute: optional(boolean(), false),
  exchangeKeyId: optional(string()),
});

export type CriarPredictionStrategyInput = InferOutput<typeof criarPredictionStrategyInputSchema>;

/** Input de atualização de configurações. */
export const atualizarPredictionSettingsInputSchema = object({
  isScanningEnabled: optional(boolean()),
  tradeSize: optional(pipe(number(), minValue(1))),
  minSpreadPct: optional(number()),
  minVolume24hUSD: optional(number()),
  maxStrategiesPerScan: optional(number()),
  maxPortfolioCapUSD: optional(number()),
  maxDailyLoss: optional(number()),
  makerOnly: optional(boolean()),
  makerRebatePct: optional(number()),
  maxSlippagePct: optional(number()),
  closeWhenComplete: optional(boolean()),
  targetProfitPct: optional(number()),
  allowedMarkets: optional(array(string())),
  scanIntervalMs: optional(number()),
});

export type AtualizarPredictionSettingsInput = InferOutput<
  typeof atualizarPredictionSettingsInputSchema
>;
