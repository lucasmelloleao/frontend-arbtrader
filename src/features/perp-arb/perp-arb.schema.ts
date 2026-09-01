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
 * Campo de referência que o backend pode devolver de três formas: string pura,
 * `null`, ou objeto populado (`{ _id, name, ... }`). Normaliza para a string
 * (ou null) extraindo o `_id`/`id` quando vier objeto.
 */
const refIdSchema = pipe(
  union([string(), nullable(object({ _id: optional(string()), id: optional(string()) }))]),
  transform((valor) => {
    if (typeof valor === "string" || valor === null) {
      return valor;
    }
    return valor._id ?? valor.id ?? null;
  }),
);

/**
 * Estratégia de arbitragem perpétuo vs spot (Funding Arb).
 * Espelha `PerpArbStrategy` do swagger, com tolerância ao shape legado do
 * backend (`_id`/`name`/`active` do srcantigo e refs populadas): normaliza na
 * borda para `id`/`nome`/`ativo`.
 */
const perpArbStrategySchema = pipe(
  object({
    id: optional(string()),
    _id: optional(string()),
    nome: optional(pipe(string(), minLength(1, "Informe o nome da estratégia."))),
    name: optional(pipe(string(), minLength(1, "Informe o nome da estratégia."))),
    perpSymbol: string(),
    spotSymbol: string(),
    tradeSize: optional(nullable(number())),
    minFundingRatePct: optional(nullable(number())),
    maxSlippagePct: optional(nullable(number())),
    maxDailyLoss: optional(nullable(number())),
    cooldownAfterLossMs: optional(nullable(number())),
    perpExchangeKeyId: refIdSchema,
    spotExchangeKeyId: refIdSchema,
    exchangeKeyId: refIdSchema,
    ativo: optional(boolean()),
    active: optional(boolean()),
    autoExecute: optional(boolean()),
    dailyLossAccum: optional(nullable(number())),
    lastLossAt: optional(nullable(string())),
    currentFundingRate: optional(nullable(number())),
    positionOpen: optional(boolean()),
    positionSize: optional(nullable(number())),
    positionOpenedAt: optional(nullable(string())),
    lastSpotPrice: optional(nullable(number())),
    lastPerpPrice: optional(nullable(number())),
    fundingCollected: optional(nullable(number())),
    fundingHistory: optional(
      array(
        object({
          amount: number(),
          timestamp: string(),
          fundingRate: optional(nullable(number())),
        }),
      ),
    ),
    autoClose: optional(boolean()),
    fundingTargetPct: optional(nullable(number())),
    maxHoldHours: optional(nullable(number())),
    fundingAtOpen: optional(nullable(number())),
    fundingCount: optional(nullable(number())),
    exitSpreadPct: optional(nullable(number())),
    exitSpreadUsd: optional(nullable(number())),
    estimatedLiquidationPrice: optional(nullable(number())),
    lastSpotBid: optional(nullable(number())),
    lastSpotAsk: optional(nullable(number())),
    lastPerpBid: optional(nullable(number())),
    lastPerpAsk: optional(nullable(number())),
  }),
  transform((entrada) => ({
    id: entrada.id ?? entrada._id ?? "",
    nome: entrada.nome ?? entrada.name ?? "",
    ativo: entrada.ativo ?? entrada.active ?? false,
    perpSymbol: entrada.perpSymbol,
    spotSymbol: entrada.spotSymbol,
    tradeSize: entrada.tradeSize ?? 0,
    minFundingRatePct: entrada.minFundingRatePct ?? 0,
    maxSlippagePct: entrada.maxSlippagePct ?? 0,
    maxDailyLoss: entrada.maxDailyLoss ?? 0,
    cooldownAfterLossMs: entrada.cooldownAfterLossMs ?? 0,
    perpExchangeKeyId: entrada.perpExchangeKeyId,
    spotExchangeKeyId: entrada.spotExchangeKeyId,
    exchangeKeyId: entrada.exchangeKeyId,
    autoExecute: entrada.autoExecute ?? false,
    dailyLossAccum: entrada.dailyLossAccum ?? 0,
    lastLossAt: entrada.lastLossAt ?? null,
    currentFundingRate: entrada.currentFundingRate ?? null,
    positionOpen: entrada.positionOpen ?? false,
    positionSize: entrada.positionSize ?? 0,
    positionOpenedAt: entrada.positionOpenedAt ?? null,
    lastSpotPrice: entrada.lastSpotPrice ?? null,
    lastPerpPrice: entrada.lastPerpPrice ?? null,
    fundingCollected: entrada.fundingCollected ?? 0,
    fundingHistory: entrada.fundingHistory ?? [],
    autoClose: entrada.autoClose ?? false,
    fundingTargetPct: entrada.fundingTargetPct ?? 0,
    maxHoldHours: entrada.maxHoldHours ?? 0,
    fundingAtOpen: entrada.fundingAtOpen ?? null,
    fundingCount: entrada.fundingCount ?? 0,
    exitSpreadPct: entrada.exitSpreadPct ?? null,
    exitSpreadUsd: entrada.exitSpreadUsd ?? null,
    estimatedLiquidationPrice: entrada.estimatedLiquidationPrice ?? null,
    lastSpotBid: entrada.lastSpotBid ?? null,
    lastSpotAsk: entrada.lastSpotAsk ?? null,
    lastPerpBid: entrada.lastPerpBid ?? null,
    lastPerpAsk: entrada.lastPerpAsk ?? null,
  })),
);

/** Tipo da estratégia (fonte única). */
export type PerpArbStrategy = InferOutput<typeof perpArbStrategySchema>;

/** Lista de estratégias (data do GET). */
export const perpArbStrategyListSchema = array(perpArbStrategySchema);

/**
 * Criação de estratégia. Espelha `PerpArbStrategyCreateRequest`.
 */
const criarStrategySchema = object({
  nome: pipe(string(), minLength(1, "Informe o nome da estratégia.")),
  perpSymbol: pipe(string(), minLength(1, "Informe o símbolo do perpétuo.")),
  spotSymbol: pipe(string(), minLength(1, "Informe o símbolo do spot.")),
  tradeSize: number(),
  minFundingRatePct: number(),
  maxSlippagePct: number(),
  maxDailyLoss: number(),
  cooldownAfterLossMs: number(),
  perpExchangeKeyId: string(),
  spotExchangeKeyId: string(),
  exchangeKeyId: string(),
  ativo: boolean(),
});

/** Payload de criação. */
export type CriarStrategyInput = InferOutput<typeof criarStrategySchema>;

/**
 * Atualização de estratégia. Espelha `PerpArbStrategyUpdateRequest`.
 */
const atualizarStrategySchema = object({
  id: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da estratégia.")),
  perpSymbol: pipe(string(), minLength(1, "Informe o símbolo do perpétuo.")),
  spotSymbol: pipe(string(), minLength(1, "Informe o símbolo do spot.")),
  tradeSize: number(),
  minFundingRatePct: number(),
  maxSlippagePct: number(),
  maxDailyLoss: number(),
  cooldownAfterLossMs: number(),
  perpExchangeKeyId: string(),
  spotExchangeKeyId: string(),
  exchangeKeyId: string(),
  ativo: boolean(),
  autoExecute: boolean(),
  autoClose: boolean(),
  fundingTargetPct: number(),
  maxHoldHours: number(),
  resetCooldown: boolean(),
});

/** Payload de atualização. */
export type AtualizarStrategyInput = InferOutput<typeof atualizarStrategySchema>;

/**
 * Schema único do formulário de estratégia (criar/editar). Cobre os campos de
 * ambos os contratos; a Server Action decide qual payload enviar.
 */
export const strategyFormSchema = object({
  id: string(),
  nome: pipe(string(), minLength(1, "Informe o nome da estratégia.")),
  perpSymbol: pipe(string(), minLength(1, "Informe o símbolo do perpétuo.")),
  spotSymbol: pipe(string(), minLength(1, "Informe o símbolo do spot.")),
  tradeSize: number(),
  minFundingRatePct: number(),
  maxSlippagePct: number(),
  maxDailyLoss: number(),
  cooldownAfterLossMs: number(),
  perpExchangeKeyId: string(),
  spotExchangeKeyId: string(),
  exchangeKeyId: string(),
  ativo: boolean(),
  autoExecute: boolean(),
  autoClose: boolean(),
  fundingTargetPct: number(),
  maxHoldHours: number(),
  resetCooldown: boolean(),
});

/** Payload do formulário de estratégia. */
export type StrategyFormInput = InferOutput<typeof strategyFormSchema>;

/**
 * Trade (transação de arbitragem). Espelha `PerpArbTrade`, com tolerância ao
 * `_id` do shape legado e refs populadas (normaliza na borda).
 */
const perpArbTradeSchema = pipe(
  object({
    id: optional(string()),
    _id: optional(string()),
    strategyId: refIdSchema,
    strategyName: optional(string()),
    perpSymbol: string(),
    spotSymbol: string(),
    type: string(),
    spotOrderId: optional(nullable(string())),
    perpOrderId: optional(nullable(string())),
    spotQuantity: optional(nullable(number())),
    perpQuantity: optional(nullable(number())),
    spotPrice: optional(nullable(number())),
    perpPrice: optional(nullable(number())),
    spotExitPrice: optional(nullable(number())),
    perpExitPrice: optional(nullable(number())),
    spotPnl: optional(nullable(number())),
    perpPnl: optional(nullable(number())),
    fundingCollected: optional(nullable(number())),
    fundingRate: optional(nullable(number())),
    fundingPct: optional(nullable(number())),
    amount: optional(nullable(number())),
    status: string(),
    pnl: optional(nullable(number())),
    fundingCount: optional(nullable(number())),
    reason: optional(nullable(string())),
    openedAt: optional(nullable(string())),
    errorMessage: optional(nullable(string())),
    createdAt: optional(string()),
  }),
  transform((entrada) => ({
    id: entrada.id ?? entrada._id ?? "",
    strategyId: entrada.strategyId ?? "",
    strategyName: entrada.strategyName ?? "",
    perpSymbol: entrada.perpSymbol,
    spotSymbol: entrada.spotSymbol,
    type: entrada.type,
    spotOrderId: entrada.spotOrderId ?? null,
    perpOrderId: entrada.perpOrderId ?? null,
    spotQuantity: entrada.spotQuantity ?? null,
    perpQuantity: entrada.perpQuantity ?? null,
    spotPrice: entrada.spotPrice ?? 0,
    perpPrice: entrada.perpPrice ?? 0,
    spotExitPrice: entrada.spotExitPrice ?? null,
    perpExitPrice: entrada.perpExitPrice ?? null,
    spotPnl: entrada.spotPnl ?? null,
    perpPnl: entrada.perpPnl ?? null,
    fundingCollected: entrada.fundingCollected ?? null,
    fundingRate: entrada.fundingRate ?? 0,
    fundingPct: entrada.fundingPct ?? 0,
    amount: entrada.amount ?? 0,
    status: entrada.status,
    pnl: entrada.pnl ?? 0,
    fundingCount: entrada.fundingCount ?? 0,
    reason: entrada.reason ?? null,
    openedAt: entrada.openedAt ?? null,
    errorMessage: entrada.errorMessage ?? null,
    createdAt: entrada.createdAt ?? "",
  })),
);

/** Tipo do trade. */
export type PerpArbTrade = InferOutput<typeof perpArbTradeSchema>;

/** Lista de trades (data do GET). */
export const perpArbTradeListSchema = array(perpArbTradeSchema);

/**
 * Configurações do robô. Espelha `PerpArbSettings`.
 */
export const perpArbSettingsSchema = object({
  isScanningEnabled: boolean(),
  lastScannedAt: nullable(string()),
  tradeSize: number(),
  minFundingRatePct: number(),
  minVolume24hUSD: number(),
  maxStrategiesPerScan: number(),
  maxPerpScan: number(),
  scanIntervalMs: number(),
  targetSpotBuyUSD: number(),
  maxDailyLoss: number(),
  maxPortfolioCapUSD: number(),
  maxSlippagePct: number(),
  minEntrySpreadPct: number(),
  closeWhileFundingPositive: boolean(),
  spreadCloseThresholdPct: number(),
  spreadCloseForcePct: number(),
  targetProfitPct: number(),
  profitTrailingDropPct: number(),
  allowedExchanges: array(string()),
});

/** Tipo das configurações. */
export type PerpArbSettings = InferOutput<typeof perpArbSettingsSchema>;

/**
 * Atualização de configurações. Espelha `PerpArbSettingsUpdateRequest`.
 */
const atualizarSettingsSchema = object({
  isScanningEnabled: boolean(),
  tradeSize: number(),
  minFundingRatePct: number(),
  minVolume24hUSD: number(),
  maxDailyLoss: number(),
  maxPortfolioCapUSD: number(),
  maxSlippagePct: number(),
  closeWhileFundingPositive: boolean(),
  spreadCloseThresholdPct: number(),
  spreadCloseForcePct: number(),
  targetProfitPct: number(),
  profitTrailingDropPct: number(),
});

/** Payload de atualização das configurações. */
export type AtualizarSettingsInput = InferOutput<typeof atualizarSettingsSchema>;

/** Logs do robô (data do GET /perp-arb/logs). */
export const perpArbLogsSchema = object({
  process: string(),
  linesCount: number(),
  logs: array(string()),
  timestamp: string(),
});

/**
 * Status de operação do robô (data do GET /bot-status). `isOnline` reflete o
 * heartbeat (online se pulsou nos últimos 3 min); `isScanningEnabled` indica se
 * o scanner automático está ativado.
 */
export const botStatusSchema = object({
  isScanningEnabled: boolean(),
  isOnline: boolean(),
  lastHeartbeat: nullable(string()),
  botName: string(),
});

/** Tipo do status do robô. */
export type BotStatus = InferOutput<typeof botStatusSchema>;

/**
 * Resumo estatístico das operações encerradas (data do GET
 * `/perp-arb/trades/resumo`). Espelha `PerpArbTradesSummaryResponse.data`.
 */
export const perpArbTradesSummarySchema = object({
  operacoesEncerradas: number(),
  totalPnl: number(),
  aprPct: number(),
  monthlyPct: number(),
  totalEntradaUsd: number(),
  totalSaidaUsd: number(),
});

/**
 * Relatório de auditoria da corretora (data do GET
 * `/perp-arb/audit-exchange`). Espelha `PerpArbAuditExchangeResponse.data`:
 * cruzamento de trades reais de Spot + Perpétuo, taxas e lucro/prejuízo.
 */
export const perpArbAuditExchangeSchema = object({
  exchange: string(),
  periodDays: number(),
  startDate: string(),
  endDate: string(),
  totais: object({
    totalEntradaSpot: number(),
    totalSaidaSpot: number(),
    totalPnlSpot: number(),
    totalPnlPerp: number(),
    taxasSpot: number(),
    taxasPerp: number(),
    totalTaxasTaker: number(),
    resultadoLiquidoTotal: number(),
  }),
  detalhesPorAtivo: array(
    object({
      symbol: string(),
      volumeEntradaSpot: number(),
      volumeSaidaSpot: number(),
      pnlBrutoSpot: number(),
      pnlBrutoPerp: number(),
      taxasSpot: number(),
      taxasPerp: number(),
      totalTaxas: number(),
      resultadoLiquidoReal: number(),
      tradesCount: number(),
      emAbertoDesconsiderado: optional(number()),
      trades: optional(
        array(
          object({
            id: string(),
            type: string(),
            symbol: string(),
            side: string(),
            time: string(),
            amount: number(),
            price: number(),
            volumeUsd: number(),
            feeCost: number(),
            feeCurrency: optional(nullable(number())),
            feeUsd: number(),
          }),
        ),
      ),
    }),
  ),
});

/** Tipo do relatório de auditoria da corretora. */
export type PerpArbAuditExchange = InferOutput<typeof perpArbAuditExchangeSchema>;

/**
 * Portfolio ao vivo (posições + moedas spot), espelho do `/portfolio/live`.
 * Usado pela action `buscarPortfolioLive` para trazer preços frescos das
 * corretoras a cada polling.
 */
export const portfolioLiveLocalSchema = object({
  spotCoins: array(
    object({
      asset: string(),
      free: number(),
      used: number(),
      total: number(),
      usdValue: number(),
      price: nullable(number()),
      bidPrice: nullable(number()),
      askPrice: nullable(number()),
      avgCostPrice: nullable(number()),
      totalCost: number(),
      totalQty: number(),
      investedValue: number(),
      pnl: number(),
      pnlPct: nullable(number()),
      exchange: string(),
    }),
  ),
  positions: array(
    object({
      exchange: string(),
      symbol: string(),
      spotSymbol: optional(nullable(string())),
      side: string(),
      contracts: number(),
      contractSize: number(),
      qty: number(),
      notional: number(),
      entryPrice: nullable(number()),
      markPrice: nullable(number()),
      bidPrice: nullable(number()),
      askPrice: nullable(number()),
      liquidationPrice: nullable(number()),
      leverage: number(),
      unrealizedPnl: number(),
      unrealizedPnlPct: number(),
      margin: number(),
    }),
  ),
  spotTotalUsd: number(),
  futuresUnrealizedPnl: number(),
  timestamp: string(),
});
