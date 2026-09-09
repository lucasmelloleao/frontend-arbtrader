import {
  array,
  boolean,
  type InferOutput,
  minLength,
  nullable,
  number,
  object,
  optional,
  pipe,
  record,
  string,
  transform,
  union,
} from "valibot";

/**
 * Campo de referência que o backend pode devolver como string ou `null`
 * (espelho do `refIdSchema` do perp-arb).
 */
const refIdSchema = union([string(), nullable(string())]);

/** Uma perna da arbitragem (compra/venda de um par). */
const forexLegSchema = object({
  symbol: string(),
  side: string(),
  price: nullable(number()),
  entryPrice: optional(nullable(number())),
  closePrice: optional(nullable(number())),
  currentPrice: optional(nullable(number())),
  amount: optional(nullable(number())),
  volume: optional(nullable(number())),
  amountUsd: optional(nullable(number())),
  orderId: optional(nullable(string())),
});

/** Tipo de uma perna. */
export type ForexArbLeg = InferOutput<typeof forexLegSchema>;

/**
 * Estratégia de arbitragem Forex (simples ou triangular). Espelha o contrato
 * do backend, normalizando `_id` do Mongo para `id` na borda.
 */
const forexArbStrategySchema = pipe(
  object({
    _id: optional(string()),
    id: optional(string()),
    name: string(),
    exchangeId: optional(string()),
    exchangeKeyId: optional(string()),
    type: string(),
    legs: optional(array(forexLegSchema)),
    tradeSize: optional(nullable(number())),
    expectedProfitPct: optional(number()),
    minProfitPct: optional(number()),
    maxSlippagePct: optional(number()),
    autoExecute: optional(boolean()),
    isAutoCreated: optional(boolean()),
    active: optional(boolean()),
    positionOpen: optional(boolean()),
    positionOpenedAt: optional(nullable(string())),
    positionSize: optional(number()),
    positionVolume: optional(number()),
    positionAmountUsd: optional(number()),
    status: optional(string()),
    closedReason: optional(nullable(string())),
    trailingStopTriggered: optional(boolean()),
    pnl: optional(number()),
    pnlPct: optional(number()),
    closedAt: optional(nullable(string())),
    peakProfitPct: optional(number()),
    peakProfitUsd: optional(number()),
    isTrailingActive: optional(boolean()),
    trailingActive: optional(boolean()),
    trailingFloorUsd: optional(number()),
    trailingFloorPrice: optional(nullable(number())),
    trailingActivationUsd: optional(number()),
    trailingDistanceUsd: optional(number()),
    currentAction: optional(string()),
    commission: optional(number()),
    swap: optional(number()),
    currentPrice: optional(nullable(number())),
    lastLegPrices: optional(record(string(), number())),
    createdAt: optional(string()),
    updatedAt: optional(string()),
  }),
  transform((entrada) => ({
    id: entrada.id ?? entrada._id ?? "",
    name: entrada.name,
    exchangeId: entrada.exchangeId ?? "",
    exchangeKeyId: entrada.exchangeKeyId ?? "",
    type: entrada.type,
    legs: entrada.legs ?? [],
    tradeSize: entrada.tradeSize ?? 0,
    expectedProfitPct: entrada.expectedProfitPct ?? 0,
    minProfitPct: entrada.minProfitPct ?? 0,
    maxSlippagePct: entrada.maxSlippagePct ?? 0,
    autoExecute: entrada.autoExecute ?? false,
    isAutoCreated: entrada.isAutoCreated ?? false,
    active: entrada.active ?? true,
    positionOpen: entrada.positionOpen ?? false,
    positionOpenedAt: entrada.positionOpenedAt ?? null,
    positionSize: entrada.positionSize ?? 0,
    positionVolume: entrada.positionVolume ?? 0,
    positionAmountUsd: entrada.positionAmountUsd ?? 0,
    status: entrada.status ?? "monitorando",
    closedReason: entrada.closedReason ?? null,
    trailingStopTriggered: entrada.trailingStopTriggered ?? false,
    pnl: entrada.pnl ?? 0,
    pnlPct: entrada.pnlPct ?? 0,
    closedAt: entrada.closedAt ?? null,
    peakProfitPct: entrada.peakProfitPct ?? 0,
    peakProfitUsd: entrada.peakProfitUsd ?? 0,
    isTrailingActive: Boolean(entrada.trailingActive && (entrada.trailingFloorUsd || 0) > 0),
    trailingActive: Boolean(entrada.trailingActive && (entrada.trailingFloorUsd || 0) > 0),
    trailingFloorUsd: entrada.trailingFloorUsd ?? 0,
    trailingFloorPrice: entrada.trailingFloorPrice ?? null,
    trailingActivationUsd: entrada.trailingActivationUsd ?? 0.07,
    trailingDistanceUsd: entrada.trailingDistanceUsd ?? 0.03,
    currentAction: entrada.currentAction ?? "Monitorando mercado",
    commission: entrada.commission ?? 0,
    swap: entrada.swap ?? 0,
    currentPrice: entrada.currentPrice ?? null,
    lastLegPrices: entrada.lastLegPrices ?? {},
    createdAt: entrada.createdAt ?? "",
    updatedAt: entrada.updatedAt ?? "",
  })),
);

/** Tipo da estratégia (fonte única). */
export type ForexArbStrategy = InferOutput<typeof forexArbStrategySchema>;

/** Lista de estratégias (data do GET). */
export const forexArbStrategyListSchema = array(forexArbStrategySchema);

/**
 * Trade (transação) de arbitragem Forex: oportunidade detectada, execução ou
 * fechamento. Espelha o contrato, normalizando `_id` → `id`.
 */
const forexArbTradeSchema = pipe(
  object({
    _id: optional(string()),
    id: optional(string()),
    strategyId: optional(nullable(refIdSchema)),
    strategyName: optional(nullable(string())),
    exchangeId: optional(nullable(string())),
    type: optional(nullable(string())),
    side: optional(nullable(string())),
    symbol: optional(nullable(string())),
    entryPrice: optional(nullable(number())),
    exitPrice: optional(nullable(number())),
    closePrice: optional(nullable(number())),
    pnl: optional(nullable(number())),
    pnlPercent: optional(nullable(number())),
    legs: optional(array(forexLegSchema)),
    amount: optional(nullable(number())),
    volume: optional(nullable(number())),
    amountUsd: optional(nullable(number())),
    expectedProfitPct: optional(nullable(number())),
    realizedPnl: optional(nullable(number())),
    commission: optional(nullable(number())),
    swap: optional(nullable(number())),
    status: optional(nullable(string())),
    closedReason: optional(nullable(string())),
    trailingStopTriggered: optional(nullable(boolean())),
    reason: optional(nullable(string())),
    errorMessage: optional(nullable(string())),
    createdAt: optional(nullable(string())),
  }),
  transform((entrada) => ({
    id: entrada.id ?? entrada._id ?? "",
    strategyId: entrada.strategyId ?? "",
    strategyName: entrada.strategyName ?? "",
    exchangeId: entrada.exchangeId ?? "",
    type: entrada.type ?? entrada.side ?? "close",
    legs: entrada.legs ?? [],
    amount: entrada.amount ?? 0,
    volume: entrada.volume ?? entrada.legs?.[0]?.volume ?? entrada.legs?.[0]?.amount ?? 0,
    amountUsd: entrada.amountUsd ?? entrada.legs?.[0]?.amountUsd ?? 0,
    expectedProfitPct: entrada.expectedProfitPct ?? 0,
    realizedPnl: entrada.realizedPnl ?? entrada.pnl ?? 0,
    commission: entrada.commission ?? 0,
    swap: entrada.swap ?? 0,
    status: entrada.status ?? "closed",
    closedReason: entrada.closedReason ?? null,
    trailingStopTriggered: entrada.trailingStopTriggered ?? false,
    reason: entrada.reason ?? null,
    errorMessage: entrada.errorMessage ?? null,
    createdAt: entrada.createdAt ?? "",
  })),
);

/** Tipo do trade. */
export type ForexArbTrade = InferOutput<typeof forexArbTradeSchema>;

/** Lista de trades (data do GET). */
export const forexArbTradeListSchema = array(forexArbTradeSchema);

/** Lista de oportunidades (data do GET — mesmo shape do trade). */
export const forexArbOpportunityListSchema = array(forexArbTradeSchema);

/**
 * Configurações do robô Forex. Espelha o contrato do `GET /forex-arb/settings`.
 */
export const forexArbSettingsSchema = object({
  isScanningEnabled: boolean(),
  lastScannedAt: nullable(string()),
  tradeSize: number(),
  minProfitPct: number(),
  minVolume24hUSD: number(),
  maxStrategiesPerScan: number(),
  scanIntervalMs: number(),
  maxDailyLoss: number(),
  maxSlippagePct: number(),
  autoExecute: boolean(),
  simpleEnabled: boolean(),
  triangularEnabled: boolean(),
  allowedExchanges: array(string()),
  takeProfitPct: optional(number()),
  stopLossPct: optional(number()),
  trailingStopPct: optional(number()),
});

/** Tipo das configurações. */
export type ForexArbSettings = InferOutput<typeof forexArbSettingsSchema>;

/**
 * Payload de atualização das configurações (POST /forex-arb/settings).
 */
const atualizarForexSettingsSchema = object({
  isScanningEnabled: boolean(),
  tradeSize: number(),
  minProfitPct: number(),
  minVolume24hUSD: number(),
  maxStrategiesPerScan: number(),
  scanIntervalMs: number(),
  maxDailyLoss: number(),
  maxSlippagePct: number(),
  autoExecute: boolean(),
  simpleEnabled: boolean(),
  triangularEnabled: boolean(),
  allowedExchanges: array(string()),
  takeProfitPct: optional(number()),
  stopLossPct: optional(number()),
  trailingStopPct: optional(number()),
});

/** Payload de atualização das configurações. */
export type AtualizarForexSettingsInput = InferOutput<typeof atualizarForexSettingsSchema>;

/**
 * Payload de criação de estratégia Forex (POST /forex-arb/strategies).
 * Espelha `ForexArbStrategyCreateRequest` do swagger.
 */
const criarForexStrategySchema = object({
  name: pipe(string(), minLength(1, "Informe o nome da estratégia.")),
  exchangeId: string(),
  exchangeKeyId: string(),
  type: string(),
  legs: array(forexLegSchema),
  tradeSize: number(),
  expectedProfitPct: number(),
  minProfitPct: number(),
  maxSlippagePct: number(),
  autoExecute: boolean(),
});

/** Payload de criação de estratégia Forex. */
export type CriarForexStrategyInput = InferOutput<typeof criarForexStrategySchema>;

/** Logs do robô Forex (data do GET /forex-arb/logs). */
export const forexArbLogsSchema = object({
  process: string(),
  linesCount: number(),
  logs: array(string()),
  timestamp: string(),
});

/** Tipo dos logs. */
export type ForexArbLogs = InferOutput<typeof forexArbLogsSchema>;
