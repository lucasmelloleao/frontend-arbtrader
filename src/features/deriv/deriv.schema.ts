import {
  array,
  boolean,
  fallback,
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
  appId: fallback(string(), "1089"),
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
  allowedSymbols: optional(array(string())),
  contractDurationSec: optional(number()),
});

export type AtualizarDerivSettingsInput = InferOutput<typeof atualizarDerivSettingsInputSchema>;

/** Schema de resposta de logs Deriv. */
export const derivLogsSchema = object({
  process: fallback(string(), "backend-arbtrader"),
  linesCount: fallback(number(), 0),
  logs: fallback(array(string()), []),
  timestamp: fallback(string(), ""),
});
