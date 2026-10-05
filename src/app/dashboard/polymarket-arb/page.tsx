import { Suspense } from "react";
import { Activity } from "lucide-react";

import { PredictionArbBoard } from "@/features/prediction-arb/components/prediction-arb-board";
import { PredictionHarvestButton } from "@/features/prediction-arb/components/prediction-harvest-button";
import { PredictionSettingsPanel } from "@/features/prediction-arb/components/prediction-settings-panel";
import { PredictionStatsHeader } from "@/features/prediction-arb/components/prediction-stats-header";
import { PredictionTerminalLogs } from "@/features/prediction-arb/components/prediction-terminal-logs";
import {
  predictionArbBotStatusSchema,
  predictionArbSettingsSchema,
  predictionArbStrategyListSchema,
  predictionArbTradeListSchema,
  predictionArbTradesSummarySchema,
  type PredictionArbBotStatus,
  type PredictionArbSettings,
  type PredictionArbStrategy,
  type PredictionArbTrade,
  type PredictionArbTradesSummary,
} from "@/features/prediction-arb/prediction-arb.schema";
import { exchangeListSchema, type Exchange } from "@/features/exchanges/exchanges.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

async function PolymarketArbContent(): Promise<React.ReactNode> {
  const [strategiesRes, tradesRes, settingsRes, tradesResumoRes, botStatusRes, exchangesRes] =
    await Promise.allSettled([
      apiClient(
        kyServer,
        API_ENDPOINTS.predictionArb.listarStrategies,
        predictionArbStrategyListSchema,
      ),
      apiClient(kyServer, API_ENDPOINTS.predictionArb.listarTrades, predictionArbTradeListSchema),
      apiClient(kyServer, API_ENDPOINTS.predictionArb.settings, predictionArbSettingsSchema),
      apiClient(
        kyServer,
        API_ENDPOINTS.predictionArb.tradesResumo,
        predictionArbTradesSummarySchema,
      ),
      apiClient(kyServer, API_ENDPOINTS.predictionArb.botStatus, predictionArbBotStatusSchema),
      apiClient(kyServer, API_ENDPOINTS.exchanges.listar, exchangeListSchema),
    ]);

  const strategies: PredictionArbStrategy[] =
    strategiesRes.status === "fulfilled" ? strategiesRes.value : [];
  const trades: PredictionArbTrade[] = tradesRes.status === "fulfilled" ? tradesRes.value : [];
  const settings: PredictionArbSettings | null =
    settingsRes.status === "fulfilled" ? settingsRes.value : null;
  const botStatus: PredictionArbBotStatus | null =
    botStatusRes.status === "fulfilled" ? botStatusRes.value : null;
  const exchanges: Exchange[] = exchangesRes.status === "fulfilled" ? exchangesRes.value : [];

  const polyKey = exchanges.find((k) => k.exchangeId === "polymarket");

  const exchangesData = polyKey
    ? [
        {
          id: polyKey.id,
          exchangeId: "polymarket",
          nome: polyKey.nome || "Polymarket Wallet",
        },
      ]
    : [];

  const summaryData: PredictionArbTradesSummary =
    tradesResumoRes.status === "fulfilled"
      ? tradesResumoRes.value
      : (() => {
          const executed = trades.filter((t) => t.type === "close_pair");
          const totalPnl = executed.reduce((acc, t) => acc + (t.pnl || 0), 0);
          const totalEntradaUsd = executed.reduce((acc, t) => acc + (t.investedUsd || 0), 0);
          const totalSaidaUsd = executed.reduce((acc, t) => acc + (t.realizedUsd || 0), 0);
          return {
            operacoesEncerradas: executed.length,
            totalPnl,
            aprPct: totalEntradaUsd > 0 ? (totalPnl / totalEntradaUsd) * 100 : 0,
            monthlyPct: totalEntradaUsd > 0 ? (totalPnl / totalEntradaUsd) * 30 : 0,
            totalEntradaUsd,
            totalSaidaUsd,
          };
        })();

  const abertas = strategies.filter((s) => s.positionOpen);
  const isOnline = Boolean(settings?.isScanningEnabled ?? botStatus?.isScanningEnabled);
  const allowLiveTrading = Boolean(settings?.allowLiveTrading ?? botStatus?.allowLiveTrading);
  const saldoDisponivel = polyKey?.pusdBalance ?? botStatus?.saldoDisponivel ?? 0;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/20 p-2.5 shadow-lg shadow-indigo-500/10">
            <Activity className="h-6 w-6 text-indigo-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Polymarket Arb</h1>
            <p className="text-xs text-slate-400">
              Arbitragem estrutural + market making em prediction markets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PredictionHarvestButton allowLiveTrading={allowLiveTrading} isOnline={isOnline} />
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              isOnline
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/15 text-rose-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? "animate-pulse bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {isOnline ? "SCANNER ONLINE" : "SCANNER OFFLINE"}
          </span>
          <PredictionSettingsPanel settings={settings} />
        </div>
      </div>

      {/* Cards de Métricas */}
      <PredictionStatsHeader
        summary={summaryData}
        abertasCount={abertas.length}
        saldoDisponivel={saldoDisponivel}
      />

      {/* Board Principal: Mercados, Posições Abertas, Histórico, Performance, IA e Carteira */}
      <PredictionArbBoard strategies={strategies} trades={trades} exchangeKeys={exchangesData} />

      {/* Logs do Terminal em Tempo Real */}
      <PredictionTerminalLogs />
    </div>
  );
}

export default function PolymarketArbPage(): React.ReactNode {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <PolymarketArbContent />
    </Suspense>
  );
}
