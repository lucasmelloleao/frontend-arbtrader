import {
  array,
  boolean,
  fallback,
  nullable,
  number,
  object,
  optional,
  string,
  type InferOutput,
} from "valibot";

/** Schema de Configurações Globais do Robô FxPro cTrader. */
const fxProSettingsSchema = object({
  accountType: fallback(string(), "demo"),
  accountId: fallback(string(), "10650441"),
  isScanningEnabled: fallback(boolean(), false),
  allowLiveTrading: fallback(boolean(), false),
  maxOpenPositions: fallback(number(), 3),
  maxDailyLoss: fallback(number(), 50),
  maxDailyProfit: fallback(number(), 100),
  defaultLotSize: fallback(number(), 0.01),
  defaultLeverage: fallback(number(), 1000),
  globalTrailingStop: fallback(boolean(), true),
  useAiMetaLabeling: fallback(boolean(), true),
  minAiConfidence: fallback(number(), 0.55),
  allowedSymbols: fallback(array(string()), ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"]),
});

export type FxProSettings = InferOutput<typeof fxProSettingsSchema>;

/** Schema de uma estratégia FxPro cTrader. */
const fxProStrategySchema = object({
  id: fallback(string(), ""),
  _id: optional(nullable(string())),
  name: fallback(string(), ""),
  symbol: fallback(string(), "EURUSD"),
  active: fallback(boolean(), true),
  status: fallback(string(), "running"),
  timeframe: fallback(string(), "5m"),
  lotSize: fallback(number(), 0.01),
  leverage: fallback(number(), 1000),
  takeProfitPips: fallback(number(), 20),
  stopLossPips: fallback(number(), 15),
  trailingStopPips: fallback(number(), 10),
  trailingStepPips: fallback(number(), 5),
  maxOpenPositions: fallback(number(), 1),
  minVarianceRatio: fallback(number(), 1.08),
  minEfficiencyRatio: fallback(number(), 0.35),
  maxSpreadPips: fallback(number(), 2.5),
  useAiMetaLabeling: fallback(boolean(), true),
  minAiConfidence: fallback(number(), 0.55),
  currentPositionId: optional(nullable(string())),
  currentSide: optional(nullable(string())),
  entryPrice: fallback(number(), 0),
  currentPnlUsd: fallback(number(), 0),
  totalTrades: fallback(number(), 0),
  winningTrades: fallback(number(), 0),
  losingTrades: fallback(number(), 0),
  totalProfitUsd: fallback(number(), 0),
  lastTradeAt: optional(nullable(string())),
  lastError: optional(nullable(string())),
  createdAt: fallback(string(), ""),
});

export type FxProStrategy = InferOutput<typeof fxProStrategySchema>;

/** Schema de Métricas de Trade FxPro. */
const fxProTradeMetricsSchema = object({
  er: fallback(number(), 0),
  varianceRatio: fallback(number(), 1.0),
  atrPct: fallback(number(), 0),
  spreadPips: fallback(number(), 0),
  expectedValue: fallback(number(), 0),
  edgePct: fallback(number(), 0),
  aiProbWin: optional(fallback(number(), 0.5)),
});

/** Schema de um Trade FxPro cTrader. */
const fxProTradeSchema = object({
  id: fallback(string(), ""),
  strategyId: fallback(string(), ""),
  positionId: fallback(string(), ""),
  symbol: fallback(string(), ""),
  side: fallback(string(), "BUY"),
  lotSize: fallback(number(), 0.01),
  entryPrice: fallback(number(), 0),
  exitPrice: optional(nullable(number())),
  stopLossPrice: optional(nullable(number())),
  takeProfitPrice: optional(nullable(number())),
  pnlUsd: fallback(number(), 0),
  pips: fallback(number(), 0),
  status: fallback(string(), "open"),
  closeReason: optional(nullable(string())),
  metrics: fallback(fxProTradeMetricsSchema, {
    er: 0,
    varianceRatio: 1.0,
    atrPct: 0,
    spreadPips: 0,
    expectedValue: 0,
    edgePct: 0,
    aiProbWin: 0.5,
  }),
  openedAt: fallback(string(), ""),
  closedAt: optional(nullable(string())),
  createdAt: fallback(string(), ""),
});

export type FxProTrade = InferOutput<typeof fxProTradeSchema>;

/** Schema do status da IA Meta-Labeling. */
const fxProMetaFeatureImportanceSchema = object({
  feature: fallback(string(), ""),
  importance: fallback(number(), 0),
  description: fallback(string(), ""),
});

const fxProMetaDatasetSampleSchema = object({
  id: fallback(string(), ""),
  symbol: fallback(string(), ""),
  side: fallback(string(), "BUY"),
  pnl: fallback(number(), 0),
  pips: fallback(number(), 0),
  isWin: fallback(boolean(), false),
  er: fallback(number(), 0),
  varianceRatio: fallback(number(), 1.0),
  atrPips: fallback(number(), 0),
  spreadPips: fallback(number(), 0),
  expectedValue: fallback(number(), 0),
  lotSize: fallback(number(), 0.01),
  probWin: fallback(number(), 50),
  openedAt: fallback(string(), ""),
});

const fxProMetaModelMetadataSchema = object({
  trainedAt: fallback(string(), ""),
  samplesCount: fallback(number(), 0),
  winRateBaseline: fallback(number(), 0),
  accuracy: fallback(number(), 0),
  features: fallback(array(string()), []),
  nEstimators: fallback(number(), 0),
  featureImportance: fallback(array(fxProMetaFeatureImportanceSchema), []),
  recentDatasetSamples: optional(array(fxProMetaDatasetSampleSchema)),
});

const fxProMetaModelStatusSchema = object({
  isTrained: fallback(boolean(), false),
  metadata: fallback(nullable(fxProMetaModelMetadataSchema), null),
  totalExecutedTrades: fallback(number(), 0),
  minTradesRequired: fallback(number(), 5),
});

export type FxProMetaModelStatus = InferOutput<typeof fxProMetaModelStatusSchema>;
