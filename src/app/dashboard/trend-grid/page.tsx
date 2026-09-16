import { Suspense } from "react";
import { Layers } from "lucide-react";

import { ForexArbBoard } from "@/features/forex-arb/components/forex-arb-board";
import { ForexScannerButton } from "@/features/forex-arb/components/forex-scanner-button";
import { ForexSettingsPanel } from "@/features/forex-arb/components/forex-settings-panel";
import { ForexStatsHeader } from "@/features/forex-arb/components/forex-stats-header";
import { ForexTerminalLogs } from "@/features/forex-arb/components/forex-terminal-logs";
import {
  forexArbOpportunityListSchema,
  forexArbSettingsSchema,
  forexArbStrategyListSchema,
  forexArbTradeListSchema,
  type ForexArbSettings,
  type ForexArbStrategy,
  type ForexArbTrade,
} from "@/features/forex-arb/forex-arb.schema";
import { exchangeListSchema } from "@/features/exchanges/exchanges.schema";
import { botStatusSchema, type BotStatus } from "@/features/perp-arb/perp-arb.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

function isLikelyGridStrategy(s: ForexArbStrategy): boolean {
  return (
    s.isGrid ||
    s.type === "trend_grid" ||
    s.name.includes("TrendGrid") ||
    s.gridLevelsCount > 0 ||
    s.name.includes("grid") ||
    s.legs.length > 0
  );
}

async function TrendGridCarregado(): Promise<React.ReactNode> {
  const [strategies, trades, opportunities, settings, botStatus, exchanges] =
    await Promise.allSettled([
      apiClient(kyServer, API_ENDPOINTS.forexArb.listarStrategies, forexArbStrategyListSchema),
      apiClient(kyServer, API_ENDPOINTS.forexArb.listarTrades, forexArbTradeListSchema),
      apiClient(kyServer, API_ENDPOINTS.forexArb.oportunidades, forexArbOpportunityListSchema),
      apiClient(kyServer, API_ENDPOINTS.forexArb.settings, forexArbSettingsSchema),
      apiClient(kyServer, API_ENDPOINTS.perpArb.botStatus, botStatusSchema, {
        method: "get",
        searchParams: { botName: "forex-trend-grid" },
      }),
      apiClient(kyServer, API_ENDPOINTS.exchanges.listar, exchangeListSchema),
    ]);

  const strategiesData: ForexArbStrategy[] =
    strategies.status === "fulfilled" ? strategies.value : [];
  const tradesData: ForexArbTrade[] = trades.status === "fulfilled" ? trades.value : [];
  const opportunitiesData: ForexArbTrade[] =
    opportunities.status === "fulfilled" ? opportunities.value : [];
  const settingsData: ForexArbSettings | null =
    settings.status === "fulfilled" ? settings.value : null;
  const botData: BotStatus | null = botStatus.status === "fulfilled" ? botStatus.value : null;
  const exchangesData = exchanges.status === "fulfilled" ? exchanges.value : [];
  const exchangeIds = exchangesData.map((e) => e.exchangeId);

  const gridStrategies = strategiesData.filter(isLikelyGridStrategy);

  // Trades: busca por strategyName contendo TrendGrid OU reason contendo grid
  const gridTrades = tradesData.filter(
    (t) =>
      t.strategyName.includes("TrendGrid") ||
      t.strategyName.includes("grid") ||
      Boolean(t.reason?.includes("grid")) ||
      (t.type === "close" && t.legs.some((l) => l.side)),
  );

  const abertas = gridStrategies.filter((s) => s.positionOpen);
  const encerradas = gridTrades.filter((t) => t.type === "close");
  const totalPnl = encerradas.reduce((acc, t) => acc + t.realizedPnl, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/20 p-2.5">
            <Layers className="h-6 w-6 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Trend Grid Bot (cTrader)
            </h1>
            <p className="text-sm text-slate-400">
              Motor de Piramidagem a Favor da Tendência & Trailing Stop Global em USD
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              botData !== null && botData.isOnline
                ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-300"
                : "border-red-500/30 bg-red-500/15 text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                botData !== null && botData.isOnline ? "animate-pulse bg-cyan-400" : "bg-red-400"
              }`}
            />
            Robô {botData !== null && botData.isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          <ForexScannerButton settings={settingsData} mode="grid" />
        </div>
      </div>

      <ForexStatsHeader
        oportunidades={opportunitiesData.length}
        abertas={abertas.length}
        encerradas={encerradas.length}
        totalPnl={totalPnl}
        melhorOportunidadePct={null}
      />

      <ForexSettingsPanel settings={settingsData} exchangeIds={exchangeIds} />

      <ForexArbBoard
        strategies={gridStrategies}
        trades={gridTrades}
        opportunities={[]}
        exchangeIds={exchangeIds}
        exchangeKeys={exchangesData}
        botType="trend_grid"
      />

      <ForexTerminalLogs />
    </div>
  );
}

export default function TrendGridPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-slate-500">Carregando Trend Grid Bot...</p>}>
        <TrendGridCarregado />
      </Suspense>
    </div>
  );
}
