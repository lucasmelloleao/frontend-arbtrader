import {
  array,
  boolean,
  fallback,
  minValue,
  nullable,
  number,
  object,
  optional,
  pipe,
  string,
  transform,
  type InferOutput,
} from "valibot";

/** Schema de uma estratégia em Prediction Market (Polymarket). */
const predictionArbStrategySchema = object({
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
  // Campos ao vivo da Polymarket (Gamma API)
  bestBid: fallback(number(), 0),
  bestAsk: fallback(number(), 0),
  lastTradePrice: fallback(number(), 0),
  spread: fallback(number(), 0),
  volume24hr: fallback(number(), 0),
  liquidity: fallback(number(), 0),
  oneHourPriceChange: fallback(number(), 0),
  openInterest: fallback(number(), 0),
  segundosParaVencer: fallback(number(), 0),
  minutosParaVencer: fallback(number(), 0),
  // Mark-to-market da posição
  bidYesAtual: fallback(number(), 0),
  bidNoAtual: fallback(number(), 0),
  valorAtual: fallback(number(), 0),
  custoTotal: fallback(number(), 0),
  pnlAtual: fallback(number(), 0),
  retornoVencimento: fallback(number(), 0),
  lucroGarantido: fallback(number(), 0),
  openOrderIds: optional(array(string())),
  probVelocity30s: fallback(number(), 0),
  probVolatility60s: fallback(number(), 0),
  askDepletionRate: fallback(number(), 0),
  oracleSource: optional(string()),
  resolutionRule: optional(string()),
  orderImbalance: optional(number()),
  cvd10s: optional(number()),
});

export type PredictionArbStrategy = InferOutput<typeof predictionArbStrategySchema>;

/** Schema de lista de estratégias `array(predictionArbStrategySchema)` */
export const predictionArbStrategyListSchema = array(predictionArbStrategySchema);

/** Schema de um trade em Prediction Market. */
const predictionArbTradeSchema = object({
  // O backend devolve `id` (formatado de _id) — obrigatório para a key do React.
  id: fallback(string(), ""),
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
  investedUsd: fallback(number(), 0),
  realizedUsd: fallback(number(), 0),
  spreadPct: fallback(number(), 0),
  reason: fallback(string(), ""),
  orderIds: fallback(array(string()), []),
  openedAt: fallback(string(), ""),
  createdAt: fallback(string(), ""),
  oracleSource: optional(string()),
  resolutionRule: optional(string()),
  cvd10s: optional(number()),
  orderImbalance: optional(number()),
  probVelocity30s: optional(number()),
  probVolatility60s: optional(number()),
  askDepletionRate: optional(number()),
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
  minVolume24hUSD: fallback(number(), 5000),
  maxStrategiesPerScan: fallback(number(), 5),
  maxPortfolioCapUSD: fallback(number(), 1000),
  maxOpenPairs: fallback(number(), 3),
  maxDailyLoss: fallback(number(), 10),
  makerOnly: fallback(boolean(), true),
  makerRebatePct: fallback(number(), 0),
  maxSlippagePct: fallback(number(), 0.1),
  closeWhenComplete: fallback(boolean(), true),
  targetProfitPct: fallback(number(), 1.0),
  minHighCertaintyProb: fallback(number(), 0.95),
  minHighCertaintyProb5m: fallback(number(), 0.95),
  minHighCertaintyProb15m: fallback(number(), 0.91),
  minWatchCertaintyProb: fallback(number(), 0.9),
  maxEntrySecondsBeforeExpiry5mAlt: fallback(number(), 60),
  maxEntrySecondsBeforeExpiry5mMaj: fallback(number(), 120),
  maxEntrySecondsBeforeExpiry15mAlt: fallback(number(), 120),
  maxEntrySecondsBeforeExpiry15mMaj: fallback(number(), 300),
  emergencyStopThreshold: fallback(number(), 0.82),
  stopLossPct: fallback(number(), 25.0),
  minTakeProfitPct: fallback(number(), 2.0),
  minAiConfidence: fallback(number(), 0.5),
  minSpotDistancePctAlt: fallback(number(), 0.05),
  minSpotDistancePctMaj: fallback(number(), 0.04),
  atrMultiplier5m: fallback(number(), 0.25),
  atrMultiplier15m: fallback(number(), 0.8),
  maxSideSpreadUsd: fallback(number(), 0.1),
  minKaufmanEr: fallback(number(), 0.2),
  minEdgePct: fallback(number(), 1.0),
  mertonWeight: fallback(number(), 0.35),
  earlyConvictionMinProbPct: fallback(number(), 80),
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
  saldoDisponivel: fallback(number(), 0),
});

export type PredictionArbBotStatus = InferOutput<typeof predictionArbBotStatusSchema>;

/** Logs do robô prediction-arb (GET /prediction-arb/logs). */
export const predictionArbLogsSchema = object({
  process: fallback(string(), "prediction-arb"),
  linesCount: fallback(number(), 0),
  logs: fallback(array(string()), []),
  timestamp: fallback(string(), ""),
});

/** Input de criação manual de estratégia. */
const criarPredictionStrategyInputSchema = object({
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
const atualizarPredictionSettingsInputSchema = object({
  isScanningEnabled: optional(boolean()),
  tradeSize: optional(pipe(number(), minValue(1))),
  minSpreadPct: optional(number()),
  minVolume24hUSD: optional(number()),
  maxStrategiesPerScan: optional(number()),
  maxPortfolioCapUSD: optional(number()),
  maxOpenPairs: optional(number()),
  maxDailyLoss: optional(number()),
  makerOnly: optional(boolean()),
  makerRebatePct: optional(number()),
  maxSlippagePct: optional(number()),
  closeWhenComplete: optional(boolean()),
  targetProfitPct: optional(number()),
  minHighCertaintyProb: optional(number()),
  minHighCertaintyProb5m: optional(number()),
  minHighCertaintyProb15m: optional(number()),
  minWatchCertaintyProb: optional(number()),
  maxEntrySecondsBeforeExpiry5mAlt: optional(number()),
  maxEntrySecondsBeforeExpiry5mMaj: optional(number()),
  maxEntrySecondsBeforeExpiry15mAlt: optional(number()),
  maxEntrySecondsBeforeExpiry15mMaj: optional(number()),
  emergencyStopThreshold: optional(number()),
  stopLossPct: optional(number()),
  minTakeProfitPct: optional(number()),
  minAiConfidence: optional(number()),
  minSpotDistancePctAlt: optional(number()),
  minSpotDistancePctMaj: optional(number()),
  atrMultiplier5m: optional(number()),
  atrMultiplier15m: optional(number()),
  maxSideSpreadUsd: optional(number()),
  minKaufmanEr: optional(number()),
  minEdgePct: optional(number()),
  mertonWeight: optional(number()),
  earlyConvictionMinProbPct: optional(number()),
  allowedMarkets: optional(array(string())),
  scanIntervalMs: optional(number()),
});

export type AtualizarPredictionSettingsInput = InferOutput<
  typeof atualizarPredictionSettingsInputSchema
>;

/** Metadata do modelo de Meta-Labeling (Random Forest) da Polymarket. */
const predictionMetaFeatureImportanceSchema = object({
  feature: fallback(string(), ""),
  importance: fallback(number(), 0),
  description: fallback(string(), ""),
});

const predictionMetaDatasetSampleSchema = object({
  id: fallback(string(), ""),
  question: fallback(string(), ""),
  slug: optional(string()),
  side: fallback(string(), "YES"),
  pnl: fallback(number(), 0),
  isWin: fallback(boolean(), false),
  er: fallback(number(), 0),
  varianceRatio: fallback(number(), 1.0),
  spotDistancePct: fallback(number(), 0),
  atrPct: fallback(number(), 0),
  expectedValue: fallback(number(), 0),
  edgePct: fallback(number(), 0),
  entryPrice: fallback(number(), 0),
  segsRestantes: fallback(number(), 0),
  probVelocity30s: optional(number()),
  probVolatility60s: optional(number()),
  askDepletionRate: optional(number()),
  orderImbalance: optional(number()),
  cvd10s: optional(number()),
  probWin: fallback(number(), 50),
  openedAt: fallback(string(), ""),
});

const predictionMetaModelMetadataSchema = object({
  trainedAt: fallback(string(), ""),
  samplesCount: fallback(number(), 0),
  winRateBaseline: fallback(number(), 0),
  accuracy: fallback(number(), 0),
  features: fallback(array(string()), []),
  nEstimators: fallback(number(), 0),
  featureImportance: fallback(array(predictionMetaFeatureImportanceSchema), []),
  recentDatasetSamples: optional(array(predictionMetaDatasetSampleSchema)),
});

/** Status do Gate 4 (Meta-Labeling) da Polymarket. */
export const predictionMetaModelStatusSchema = object({
  isTrained: fallback(boolean(), false),
  metadata: fallback(nullable(predictionMetaModelMetadataSchema), null),
  totalExecutedTrades: fallback(number(), 0),
  minTradesRequired: fallback(number(), 10),
});

export type PredictionMetaModelStatus = InferOutput<typeof predictionMetaModelStatusSchema>;
