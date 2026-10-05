import { Suspense } from "react";

import { HeaderOperacoes } from "@/features/perp-arb/components/header-operacoes";
import { OperationsBoard } from "@/features/perp-arb/components/operations-board";
import { SettingsPanel } from "@/features/perp-arb/components/settings-panel";
import { StatsHeader } from "@/features/perp-arb/components/stats-header";
import { StrategiesManager } from "@/features/perp-arb/strategies-manager";
import { TerminalLogs } from "@/features/perp-arb/components/terminal-logs";
import {
  perpArbSettingsSchema,
  perpArbStrategyListSchema,
  perpArbTradeListSchema,
  perpArbTradesSummarySchema,
  type PerpArbSettings,
  type PerpArbStrategy,
  type PerpArbTrade,
} from "@/features/perp-arb/perp-arb.schema";
import { exchangeListSchema } from "@/features/exchanges/exchanges.schema";
import { portfolioResumoSchema } from "@/features/portfolio/portfolio.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Carrega estratégias, trades, configurações, saldos e corretoras do backend e
 * monta a tela. Separado da página porque ler o cookie (dentro do `kyServer`)
 * torna a subárvore dinâmica — fica sob `<Suspense>` (streaming, sempre
 * fresco). Os preços ao vivo das posições são buscados pelo `OperationsBoard`
 * a cada 10s.
 *
 * Cada chamada é capturada individualmente: se um endpoint demorar/estourar o
 * timeout (backend lento), a seção correspondente mostra estado vazio/aviso em
 * vez de derrubar a página inteira (o `Promise.all` falharia tudo junto).
 */
async function PerpArbCarregado(): Promise<React.ReactNode> {
  const [strategies, trades, settings, resumo, exchanges, tradesResumo] = await Promise.allSettled([
    apiClient(kyServer, API_ENDPOINTS.perpArb.listarStrategies, perpArbStrategyListSchema),
    apiClient(kyServer, API_ENDPOINTS.perpArb.listarTrades, perpArbTradeListSchema),
    apiClient(kyServer, API_ENDPOINTS.perpArb.settings, perpArbSettingsSchema),
    apiClient(kyServer, API_ENDPOINTS.portfolio.resumo, portfolioResumoSchema),
    apiClient(kyServer, API_ENDPOINTS.exchanges.listar, exchangeListSchema),
    apiClient(kyServer, API_ENDPOINTS.perpArb.tradesResumo, perpArbTradesSummarySchema),
  ]);

  const strategiesData: PerpArbStrategy[] =
    strategies.status === "fulfilled" ? strategies.value : [];
  const tradesData: PerpArbTrade[] = trades.status === "fulfilled" ? trades.value : [];
  const settingsData: PerpArbSettings | null =
    settings.status === "fulfilled" ? settings.value : null;
  const exchangesData = exchanges.status === "fulfilled" ? exchanges.value : [];
  const tradesResumoData =
    tradesResumo.status === "fulfilled"
      ? tradesResumo.value
      : {
          operacoesEncerradas: 0,
          totalPnl: 0,
          aprPct: 0,
          monthlyPct: 0,
          totalEntradaUsd: 0,
          totalSaidaUsd: 0,
        };

  // Posições em aberto: estratégias com positionOpen + trades open_hedge sem close
  const closedTradeIds = new Set(
    tradesData
      .filter((t) => t.type === "close_hedge")
      .map((t) => `${t.strategyId}-${t.perpSymbol}`),
  );
  const openTrades = tradesData.filter(
    (t) =>
      t.type === "open_hedge" &&
      (t.status === "executed" || t.status === "simulated") &&
      !closedTradeIds.has(`${t.strategyId}-${t.perpSymbol}`),
  );
  const openFromTrades = openTrades
    .filter((t) => !strategiesData.some((s) => s.id === t.strategyId && s.positionOpen))
    .map((t) => ({
      id: t.strategyId || t.id,
      nome: t.strategyName || t.perpSymbol,
      perpSymbol: t.perpSymbol,
      spotSymbol: t.spotSymbol,
      tradeSize: t.amount,
      minFundingRatePct: 0,
      maxSlippagePct: 0,
      maxDailyLoss: 0,
      cooldownAfterLossMs: 0,
      perpExchangeKeyId: null,
      spotExchangeKeyId: null,
      exchangeKeyId: null,
      ativo: true,
      autoExecute: false,
      dailyLossAccum: 0,
      lastLossAt: null,
      currentFundingRate: null,
      positionOpen: true,
      positionSize: t.amount,
      positionOpenedAt: t.createdAt,
      lastSpotPrice: t.spotPrice,
      lastPerpPrice: t.perpPrice,
      fundingCollected: 0,
      fundingHistory: [],
      autoClose: false,
      fundingTargetPct: 0,
      maxHoldHours: 0,
      fundingAtOpen: null,
      fundingCount: 0,
      exitSpreadPct: null,
      exitSpreadUsd: null,
      estimatedLiquidationPrice: null,
      lastSpotBid: null,
      lastSpotAsk: null,
      lastPerpBid: null,
      lastPerpAsk: null,
    }));
  const openPositions = [...strategiesData.filter((s) => s.positionOpen), ...openFromTrades];

  const executedCount = tradesData.filter(
    (t) =>
      t.type === "close_hedge" &&
      (t.status === "executed" || t.status === "simulated" || t.status === "voided"),
  ).length;
  const totalPnl = tradesData.reduce((acc, t) => acc + t.pnl, 0);
  const marriedTrades = tradesData.filter(
    (t) => t.type === "close_hedge" && (t.status === "executed" || t.status === "simulated"),
  );

  return (
    <div className="space-y-6">
      {settingsData !== null ? (
        <HeaderOperacoes settings={settingsData} />
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          ⚠️ Não foi possível carregar o status do robô (backend indisponível no momento).
        </div>
      )}

      <StatsHeader
        openCount={openPositions.length}
        totalMonitored={strategiesData.length}
        executedCount={executedCount}
        totalPnl={totalPnl}
        spotUsdt={resumo.status === "fulfilled" ? resumo.value.spotUsdt : 0}
        spotUsdc={resumo.status === "fulfilled" ? resumo.value.spotUsdc : 0}
        futuresUsdt={resumo.status === "fulfilled" ? resumo.value.futuresUsdt : 0}
        futuresUsdc={resumo.status === "fulfilled" ? resumo.value.futuresUsdc : 0}
        exchanges={resumo.status === "fulfilled" ? resumo.value.exchanges : []}
        globalClosedApr={tradesResumoData.aprPct}
        monthlyPct={tradesResumoData.monthlyPct}
        totalEntryVolume={tradesResumoData.totalEntradaUsd}
        totalExitVolume={tradesResumoData.totalSaidaUsd}
      />

      <OperationsBoard
        openPositions={openPositions}
        marriedTrades={marriedTrades}
        trades={tradesData}
      />

      {settingsData !== null ? <SettingsPanel settings={settingsData} /> : null}

      <TerminalLogs />

      <StrategiesManager strategies={strategiesData} exchanges={exchangesData} />
    </div>
  );
}

/**
 * Arbitragem de Funding Rates (perpétuo vs spot): estatísticas, operações em
 * aberto/encerradas, configurações, terminal de logs e estratégias. Leitura é
 * RSC paralela; mutações são Server Actions com `revalidatePath`.
 */
export default function PerpetualArbPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-slate-500">Carregando estratégias...</p>}>
        <PerpArbCarregado />
      </Suspense>
    </div>
  );
}
