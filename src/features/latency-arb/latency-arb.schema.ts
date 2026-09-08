import {
  array,
  boolean,
  type InferOutput,
  nullable,
  number,
  object,
  optional,
  pipe,
  string,
} from "valibot";

export const latencySettingsSchema = object({
  _id: optional(string()),
  userId: optional(string()),
  isScanningEnabled: optional(boolean(), false),
  lastScannedAt: optional(nullable(string())),
  tradeSize: optional(number(), 100),
  minTriggerPips: optional(number(), 1.5),
  maxLagMs: optional(number(), 500),
  minProfitUsd: optional(number(), 0.10),
  maxDailyLoss: optional(number(), 10),
  autoExecute: optional(boolean(), false),
  takeProfitPct: optional(number(), 0.5),
  stopLossPct: optional(number(), 0.3),
  trailingStopPct: optional(number(), 0.2),
  allowedSymbols: optional(array(string()), ["EUR/USD"]),
});

export type LatencySettings = InferOutput<typeof latencySettingsSchema>;

export const latencyTradeSchema = object({
  _id: string(),
  strategyName: optional(string()),
  symbol: string(),
  fastBroker: optional(string()),
  slowBroker: optional(string()),
  side: string(),
  fastPrice: number(),
  slowPrice: number(),
  exitPrice: optional(nullable(number())),
  lagMs: number(),
  displacementPips: number(),
  amount: number(),
  status: string(),
  pnl: number(),
  netPnl: number(),
  tradingFees: number(),
  reason: optional(nullable(string())),
  closedAt: optional(nullable(string())),
  createdAt: string(),
});

export type LatencyTrade = InferOutput<typeof latencyTradeSchema>;
export const latencyTradeListSchema = array(latencyTradeSchema);
