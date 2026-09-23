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

/** Schema de um trade na Deriv. */
const derivTradeSchema = object({
  id: fallback(string(), ""),
  contractId: fallback(string(), ""),
  symbol: fallback(string(), ""),
  strategyName: fallback(string(), ""),
  question: fallback(string(), ""),
  contractType: fallback(string(), "RISE"),
  status: fallback(string(), "executed"),
  buyPrice: fallback(number(), 0),
  sellPrice: fallback(number(), 0),
  pnl: fallback(number(), 0),
  investedUsd: fallback(number(), 0),
  realizedUsd: fallback(number(), 0),
  reason: fallback(string(), ""),
  openedAt: fallback(string(), ""),
  createdAt: fallback(string(), ""),
});

export type DerivTrade = InferOutput<typeof derivTradeSchema>;

/** Schema de lista de trades Deriv */
export const derivTradeListSchema = array(derivTradeSchema);

/** Schema do resumo de trades Deriv. */
export const derivTradesSummarySchema = object({
  operacoesEncerradas: fallback(number(), 0),
  totalPnl: fallback(number(), 0),
  winRate: fallback(number(), 0),
  totalEntradaUsd: fallback(number(), 0),
  totalSaidaUsd: fallback(number(), 0),
});

export type DerivTradesSummary = InferOutput<typeof derivTradesSummarySchema>;

/** Schema das configurações do robô Deriv. */
export const derivSettingsSchema = object({
  userId: fallback(string(), ""),
  appId: fallback(string(), "34kQP2mEzJFjAJ2q1atub"),
  accountType: fallback(string(), "demo"),
  demoApiToken: fallback(string(), ""),
  realApiToken: fallback(string(), ""),
  apiToken: fallback(string(), ""),
  isScanningEnabled: fallback(boolean(), false),
  allowLiveTrading: fallback(boolean(), false),
  tradeSize: fallback(number(), 5),
  maxOpenContracts: fallback(number(), 3),
  maxDailyLoss: fallback(number(), 10),
  minHighCertaintyProb: fallback(number(), 0.95),
  emergencyStopPct: fallback(number(), 20),
  minTakeProfitPct: fallback(number(), 2.0),
  minPayoutPct: fallback(number(), 35.0),
  allowedSymbols: fallback(array(string()), ["frxBTCUSD", "frxETHUSD", "R_100", "R_50"]),
  contractDurationSec: fallback(number(), 300),
});

export type DerivSettings = InferOutput<typeof derivSettingsSchema>;

/** Input de atualização de configurações Deriv. */
const atualizarDerivSettingsInputSchema = object({
  appId: optional(string()),
  accountType: optional(string()),
  demoApiToken: optional(string()),
  realApiToken: optional(string()),
  apiToken: optional(string()),
  isScanningEnabled: optional(boolean()),
  allowLiveTrading: optional(boolean()),
  tradeSize: optional(number()),
  maxOpenContracts: optional(number()),
  maxDailyLoss: optional(number()),
  minHighCertaintyProb: optional(number()),
  emergencyStopPct: optional(number()),
  minTakeProfitPct: optional(number()),
  minPayoutPct: optional(number()),
  allowedSymbols: optional(array(string())),
  contractDurationSec: optional(number()),
});

export type AtualizarDerivSettingsInput = InferOutput<typeof atualizarDerivSettingsInputSchema>;

export const derivLogsSchema = object({
  process: fallback(string(), "backend-arbtrader"),
  linesCount: fallback(number(), 0),
  logs: fallback(array(string()), []),
  timestamp: fallback(string(), ""),
});

/** Schema de uma Estratégia por Ativo na Deriv. */
const derivStrategySchema = object({
  id: fallback(string(), ""),
  name: fallback(string(), ""),
  symbol: fallback(string(), "1HZ10V"),
  contractType: fallback(string(), "BOTH_HL"),
  barrier: fallback(string(), "-1"),
  barrierLower: fallback(string(), "+1"),
  tradeSize: fallback(number(), 2),
  durationSec: fallback(number(), 15),
  minCertaintyProb: fallback(number(), 0.75),
  minTakeProfitPct: fallback(number(), 15),
  emergencyStopPct: fallback(number(), 70),
  active: fallback(boolean(), true),
  positionOpen: fallback(boolean(), false),
  contractId: fallback(nullable(string()), null),
  pnl: fallback(number(), 0),
  lastCheckAt: fallback(string(), ""),
  lastTradeAt: fallback(string(), ""),
  createdAt: fallback(string(), ""),
});

export type DerivStrategy = InferOutput<typeof derivStrategySchema>;

export const derivStrategyListSchema = array(derivStrategySchema);

const criarDerivStrategyInputSchema = object({
  name: optional(string()),
  symbol: string(),
  contractType: optional(string()),
  barrier: optional(string()),
  barrierLower: optional(string()),
  tradeSize: optional(number()),
  durationSec: optional(number()),
  minCertaintyProb: optional(number()),
  minTakeProfitPct: optional(number()),
  emergencyStopPct: optional(number()),
  active: optional(boolean()),
});

export type CriarDerivStrategyInput = InferOutput<typeof criarDerivStrategyInputSchema>;

const atualizarDerivStrategyInputSchema = object({
  id: string(),
  name: optional(string()),
  symbol: optional(string()),
  contractType: optional(string()),
  barrier: optional(string()),
  barrierLower: optional(string()),
  tradeSize: optional(number()),
  durationSec: optional(number()),
  minCertaintyProb: optional(number()),
  minTakeProfitPct: optional(number()),
  emergencyStopPct: optional(number()),
  active: optional(boolean()),
});

export type AtualizarDerivStrategyInput = InferOutput<typeof atualizarDerivStrategyInputSchema>;

/** Schema de resposta de saldo Deriv. */
const derivAccountBalanceSchema = object({
  loginId: fallback(string(), ""),
  balance: fallback(number(), 0),
  currency: fallback(string(), "USD"),
});

export const derivBalanceSchema = object({
  demo: fallback(nullable(derivAccountBalanceSchema), null),
  real: fallback(nullable(derivAccountBalanceSchema), null),
  activeAccount: fallback(string(), "demo"),
});

export type DerivBalance = InferOutput<typeof derivBalanceSchema>;

/** Linha agregada da análise retrospectiva por IA. */
const derivAiAggregateSchema = object({
  chave: fallback(string(), ""),
  trades: fallback(number(), 0),
  vitorias: fallback(number(), 0),
  derrotas: fallback(number(), 0),
  winRatePct: fallback(number(), 0),
  pnl: fallback(number(), 0),
});

/** Schema da análise retrospectiva por IA (Gemini/DeepSeek). */
export const derivAiAnalysisSchema = object({
  metrics: object({
    totalTrades: fallback(number(), 0),
    wins: fallback(number(), 0),
    losses: fallback(number(), 0),
    winRatePct: fallback(number(), 0),
    totalPnl: fallback(number(), 0),
    totalInvestido: fallback(number(), 0),
    totalRealizado: fallback(number(), 0),
    avgWin: fallback(number(), 0),
    avgLoss: fallback(number(), 0),
    profitFactor: fallback(number(), 0),
    porSimbolo: fallback(array(derivAiAggregateSchema), []),
    porTipoContrato: fallback(array(derivAiAggregateSchema), []),
    porEstrategia: fallback(array(derivAiAggregateSchema), []),
    porHora: fallback(array(derivAiAggregateSchema), []),
  }),
  analysis: fallback(string(), ""),
});

export type DerivAiAnalysis = InferOutput<typeof derivAiAnalysisSchema>;
