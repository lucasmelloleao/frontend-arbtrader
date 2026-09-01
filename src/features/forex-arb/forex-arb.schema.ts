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
  amount: optional(nullable(number())),
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
    status: optional(string()),
    pnl: optional(number()),
    closedAt: optional(nullable(string())),
    peakProfitPct: optional(number()),
    lastLegPrices: optional(object({})),
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
    status: entrada.status ?? "monitorando",
    pnl: entrada.pnl ?? 0,
    closedAt: entrada.closedAt ?? null,
    peakProfitPct: entrada.peakProfitPct ?? 0,
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
    strategyId: refIdSchema,
    strategyName: optional(string()),
    exchangeId: optional(string()),
    type: string(),
    legs: optional(array(forexLegSchema)),
    amount: optional(number()),
    expectedProfitPct: optional(number()),
    realizedPnl: optional(number()),
    status: optional(string()),
    reason: optional(nullable(string())),
    errorMessage: optional(nullable(string())),
    createdAt: optional(string()),
  }),
  transform((entrada) => ({
    id: entrada.id ?? entrada._id ?? "",
    strategyId: entrada.strategyId ?? "",
    strategyName: entrada.strategyName ?? "",
    exchangeId: entrada.exchangeId ?? "",
    type: entrada.type,
    legs: entrada.legs ?? [],
    amount: entrada.amount ?? 0,
    expectedProfitPct: entrada.expectedProfitPct ?? 0,
    realizedPnl: entrada.realizedPnl ?? 0,
    status: entrada.status ?? "detected",
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
