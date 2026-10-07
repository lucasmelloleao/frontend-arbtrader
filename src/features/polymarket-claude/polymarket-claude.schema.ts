import {
  array,
  boolean,
  fallback,
  number,
  nullish,
  object,
  optional,
  string,
  type InferOutput,
} from "valibot";

const polymarketClaudeStrategySchema = object({
  id: string(),
  nome: fallback(string(), ""),
  slug: fallback(string(), ""),
  marketId: fallback(string(), ""),
  conditionId: fallback(string(), ""),
  yesPrice: fallback(number(), 0),
  noPrice: fallback(number(), 0),
  spreadPct: fallback(number(), 0),
  tradeSize: fallback(number(), 1.0),
  ativo: fallback(boolean(), true),
  autoExecute: fallback(boolean(), false),
  positionOpen: fallback(boolean(), false),
  positionSize: fallback(number(), 0),
  yesShares: fallback(number(), 0),
  noShares: fallback(number(), 0),
  avgYesPrice: fallback(number(), 0),
  avgNoPrice: fallback(number(), 0),
  targetProfitPct: fallback(number(), 1.8),
  stopLossPct: fallback(number(), 15.0),
  endDate: fallback(string(), ""),
  isAutoCreated: fallback(boolean(), false),
  createdAt: fallback(string(), ""),
  hurstExponent: fallback(number(), 0.42),
  adfPValue: fallback(number(), 0.01),
  sharpeEstimate: fallback(number(), 1.85),
  rbiStatus: fallback(string(), "INCUBATE"),
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
  bidYesAtual: fallback(number(), 0),
  bidNoAtual: fallback(number(), 0),
  valorAtual: fallback(number(), 0),
  custoTotal: fallback(number(), 0),
  pnlAtual: fallback(number(), 0),
  retornoVencimento: fallback(number(), 0),
  lucroGarantido: fallback(number(), 0),
  // Campos novos
  adaptiveStopLossPct: fallback(number(), 0.5),
  kellySize: fallback(number(), 0),
  correlationGroup: fallback(string(), ""),
  hedgeShares: fallback(number(), 0),
  hedgeEntryPrice: fallback(number(), 0),
  peakBalance: fallback(number(), 0),
  currentBalance: fallback(number(), 0),
  openOrderIds: optional(array(string())),
});

export const polymarketClaudeStrategyListSchema = array(polymarketClaudeStrategySchema);

const polymarketClaudeTradeSchema = object({
  id: string(),
  strategyId: nullish(string()),
  slug: fallback(string(), ""),
  question: fallback(string(), ""),
  type: fallback(string(), ""),
  status: fallback(string(), ""),
  side: nullish(string()),
  yesPrice: nullish(number()),
  noPrice: nullish(number()),
  amount: nullish(number()),
  pnl: fallback(number(), 0),
  investedUsd: fallback(number(), 0),
  realizedUsd: fallback(number(), 0),
  reason: nullish(string()),
  isMaker: fallback(boolean(), true),
  slippageBps: fallback(number(), 0.1),
  rttMs: fallback(number(), 45),
  metrics: nullish(
    object({
      hurst: fallback(number(), 0),
      adfPValue: fallback(number(), 0),
      sharpeEstimate: fallback(number(), 0),
      cvdDelta: fallback(number(), 0),
      expectedValue: fallback(number(), 0),
      edgeScore: fallback(number(), 0),
    }),
  ),
  createdAt: fallback(string(), ""),
});

export const polymarketClaudeTradeListSchema = array(polymarketClaudeTradeSchema);

export const polymarketClaudeTradesSummarySchema = object({
  totalTrades: fallback(number(), 0),
  winningTrades: fallback(number(), 0),
  losingTrades: fallback(number(), 0),
  totalPnl: fallback(number(), 0),
  winRate: fallback(number(), 0),
  makerRate: fallback(number(), 100),
  avgSlippageBps: fallback(number(), 0.1),
  live: optional(
    object({
      totalTrades: fallback(number(), 0),
      winningTrades: fallback(number(), 0),
      losingTrades: fallback(number(), 0),
      totalPnl: fallback(number(), 0),
      winRate: fallback(number(), 0),
      volumeUsd: fallback(number(), 0),
      balanceUsd: fallback(number(), 0),
    }),
  ),
  simulated: optional(
    object({
      totalTrades: fallback(number(), 0),
      winningTrades: fallback(number(), 0),
      losingTrades: fallback(number(), 0),
      totalPnl: fallback(number(), 0),
      winRate: fallback(number(), 0),
      volumeUsd: fallback(number(), 0),
    }),
  ),
});

export const polymarketClaudeSettingsSchema = object({
  userId: optional(string()),
  isScanningEnabled: fallback(boolean(), false),
  allowLiveTrading: fallback(boolean(), false),
  tradeSize: fallback(number(), 2.0),
  minSpreadPct: fallback(number(), 0.2),
  minVolume24hUSD: fallback(number(), 2500),
  maxOpenPairs: fallback(number(), 3),
  maxDailyLoss: fallback(number(), 2.0),
  makerOnly: fallback(boolean(), true),
  postOnly: fallback(boolean(), true),
  maxSlippagePct: fallback(number(), 0.05),
  stopLossPct: fallback(number(), 15.0),
  targetProfitPct: fallback(number(), 1.8),
  minHurstExponent: fallback(number(), 0.5),
  minSharpeRatio: fallback(number(), 1.5),
  minAdfPValue: fallback(number(), 0.05),
  enableCvdFilter: fallback(boolean(), true),
  cvdWindowSeconds: fallback(number(), 30),
  marketCoins: fallback(array(string()), ["btc", "eth", "sol"]),
  marketFilter: fallback(string(), ""),
  incubateMode: fallback(boolean(), true),
  incubateDaysTarget: fallback(number(), 30),
  enableTrailingStop: fallback(boolean(), true),
  trailingActivationGainCents: fallback(number(), 0.1),
  trailingStepCents: fallback(number(), 0.01),
  trailingStopOffsetCents: fallback(number(), 0.01),
  enableTakerAggression: fallback(boolean(), true),
  takerConfidenceThreshold: fallback(number(), 0.3),
  enableStopLoss: fallback(boolean(), true),
  stopLossPercent: fallback(number(), 0.5),
  // Stop Loss Adaptativo
  enableAdaptiveStopLoss: fallback(boolean(), true),
  adaptiveStopLossUnderdogPct: fallback(number(), 0.65),
  adaptiveStopLossFavoritePct: fallback(number(), 0.35),
  adaptiveStopLossMidPct: fallback(number(), 0.5),
  // Kelly Criterion Sizing
  enableKellySizing: fallback(boolean(), true),
  kellyFraction: fallback(number(), 0.25),
  minTradeSize: fallback(number(), 1.0),
  maxTradeSize: fallback(number(), 10.0),
  // Correlação
  enableCorrelationFilter: fallback(boolean(), true),
  correlatedSizeReductionPct: fallback(number(), 0.5),
  // Time-decay buffer
  enableTimeDecayBuffer: fallback(boolean(), true),
  timeDecayBufferSeconds: fallback(number(), 7200),
  timeDecayBufferMinProfitPct: fallback(number(), 0.05),
  // Rebalance via mid-price
  enableMidPriceRebalance: fallback(boolean(), true),
  rebalancePassiveWaitMs: fallback(number(), 5000),
  // Expansão de mercados
  enableMarketExpansion: fallback(boolean(), true),
  minMarketVolume24h: fallback(number(), 10000),
  minMarketLiquidity: fallback(number(), 5000),
  minMarketTimeSeconds: fallback(number(), 3600),
  // Drawdown Circuit Breaker
  enablePortfolioDrawdownBreaker: fallback(boolean(), true),
  maxPortfolioDrawdownPct: fallback(number(), 0.1),
  drawdownRecoveryPct: fallback(number(), 0.05),
  // Hedge
  enableHedgeMode: fallback(boolean(), false),
  hedgeSizeFraction: fallback(number(), 0.3),
});

export const polymarketClaudeBotStatusSchema = object({
  botName: fallback(string(), "polymarket-claude-rbi"),
  isRunning: fallback(boolean(), false),
  allowLiveTrading: fallback(boolean(), false),
  incubateMode: fallback(boolean(), true),
  lastHeartbeat: fallback(string(), ""),
  rttMs: fallback(number(), 38),
  activeFsmState: fallback(string(), "IDLE_MAKER_MONITORING"),
  rbiPhase: fallback(string(), "INCUBATE"),
});

export const polymarketClaudeLogsSchema = object({
  lines: fallback(array(string()), []),
});

export type PolymarketClaudeStrategy = InferOutput<typeof polymarketClaudeStrategySchema>;
export type PolymarketClaudeTrade = InferOutput<typeof polymarketClaudeTradeSchema>;
export type PolymarketClaudeTradesSummary = InferOutput<typeof polymarketClaudeTradesSummarySchema>;
export type PolymarketClaudeSettings = InferOutput<typeof polymarketClaudeSettingsSchema>;
export type PolymarketClaudeBotStatus = InferOutput<typeof polymarketClaudeBotStatusSchema>;
