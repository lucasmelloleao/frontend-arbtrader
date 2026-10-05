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

/** Schema de Configurações Globais do Robô IC Markets cTrader. */
const icMarketsSettingsSchema = object({
  accountType: fallback(string(), "demo"),
  accountId: fallback(string(), "10117517"),
  isScanningEnabled: fallback(boolean(), false),
  allowLiveTrading: fallback(boolean(), false),
  maxOpenPositions: fallback(number(), 3),
  maxDailyLoss: fallback(number(), 50),
  maxDailyProfit: fallback(number(), 100),
  defaultLotSize: fallback(number(), 0.01),
  defaultLeverage: fallback(number(), 500),
  globalTrailingStop: fallback(boolean(), true),
  useAiMetaLabeling: fallback(boolean(), true),
  minAiConfidence: fallback(number(), 0.55),
  allowedSymbols: fallback(array(string()), ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"]),
});

export type IcMarketsSettings = InferOutput<typeof icMarketsSettingsSchema>;

/** Schema de uma estratégia IC Markets cTrader. */
const icMarketsStrategySchema = object({
  id: fallback(string(), ""),
  _id: optional(nullable(string())),
  name: fallback(string(), ""),
  symbol: fallback(string(), "EURUSD"),
  active: fallback(boolean(), true),
  status: fallback(string(), "running"),
  timeframe: fallback(string(), "5m"),
  lotSize: fallback(number(), 0.01),
  leverage: fallback(number(), 500),
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

export type IcMarketsStrategy = InferOutput<typeof icMarketsStrategySchema>;

/** Schema de Métricas de Trade IC Markets. */
const icMarketsTradeMetricsSchema = object({
  er: fallback(number(), 0),
  varianceRatio: fallback(number(), 1.0),
  atrPct: fallback(number(), 0),
  spreadPips: fallback(number(), 0),
  expectedValue: fallback(number(), 0),
  edgePct: fallback(number(), 0),
  aiProbWin: optional(fallback(number(), 0.5)),
});

/** Schema de um Trade IC Markets cTrader. */
const icMarketsTradeSchema = object({
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
  metrics: fallback(icMarketsTradeMetricsSchema, {
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

export type IcMarketsTrade = InferOutput<typeof icMarketsTradeSchema>;

/** Schema de Saldo da Conta. */
const icMarketsBalanceSchema = object({
  balance: fallback(number(), 0),
  equity: fallback(number(), 0),
  leverage: optional(fallback(number(), 500)),
  currency: fallback(string(), "USD"),
  accountType: fallback(string(), "demo"),
  accountId: fallback(string(), "10102182"),
});

export type IcMarketsBalance = InferOutput<typeof icMarketsBalanceSchema>;

/** Schema de Metadados da IA Meta-Labeling. */
const icMarketsAiMetadataSchema = object({
  trainedAt: fallback(string(), ""),
  samplesCount: fallback(number(), 0),
  winRateBaseline: fallback(number(), 0),
  accuracy: fallback(number(), 0),
  features: fallback(array(string()), []),
  nEstimators: fallback(number(), 30),
  featureImportance: optional(
    array(
      object({
        feature: string(),
        importance: number(),
        description: string(),
      }),
    ),
  ),
  recentDatasetSamples: optional(
    array(
      object({
        id: string(),
        symbol: string(),
        side: string(),
        pnl: number(),
        pips: number(),
        isWin: boolean(),
        er: number(),
        varianceRatio: number(),
        atrPips: number(),
        spreadPips: number(),
        expectedValue: number(),
        lotSize: number(),
        probWin: number(),
        openedAt: string(),
      }),
    ),
  ),
});

export type IcMarketsAiMetadata = InferOutput<typeof icMarketsAiMetadataSchema>;
