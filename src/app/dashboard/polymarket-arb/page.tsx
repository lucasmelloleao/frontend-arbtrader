import { Suspense } from "react";

import { Activity } from "lucide-react";

import { PredictionArbBoard } from "@/features/prediction-arb/components/prediction-arb-board";
import { PredictionHarvestButton } from "@/features/prediction-arb/components/prediction-harvest-button";
import { PredictionScannerButton } from "@/features/prediction-arb/components/prediction-scanner-button";
import { PredictionSettingsPanel } from "@/features/prediction-arb/components/prediction-settings-panel";
import { PredictionStatsHeader } from "@/features/prediction-arb/components/prediction-stats-header";
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
import { exchangeListSchema } from "@/features/exchanges/exchanges.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Carrega estratégias, trades, resumo, configurações, status do robô e chaves
 * de corretoras do backend em paralelo para montar a tela de Polymarket Arb.
 */
async function PolymarketArbCarregado(): Promise<React.ReactNode> {
  const [strategies, trades, summary, settings, botStatus, exchanges] = await Promise.allSettled([
    apiClient(
      kyServer,
      API_ENDPOINTS.predictionArb.listarStrategies,
      predictionArbStrategyListSchema,
    ),
    apiClient(kyServer, API_ENDPOINTS.predictionArb.listarTrades, predictionArbTradeListSchema),
    apiClient(kyServer, API_ENDPOINTS.predictionArb.tradesResumo, predictionArbTradesSummarySchema),
    apiClient(kyServer, API_ENDPOINTS.predictionArb.settings, predictionArbSettingsSchema),
    apiClient(kyServer, API_ENDPOINTS.predictionArb.botStatus, predictionArbBotStatusSchema),
    apiClient(kyServer, API_ENDPOINTS.exchanges.listar, exchangeListSchema),
  ]);

  const strategiesData: PredictionArbStrategy[] =
    strategies.status === "fulfilled" ? strategies.value : [];
  const tradesData: PredictionArbTrade[] = trades.status === "fulfilled" ? trades.value : [];
  const summaryData: PredictionArbTradesSummary | null =
    summary.status === "fulfilled" ? summary.value : null;
  const settingsData: PredictionArbSettings | null =
    settings.status === "fulfilled" ? settings.value : null;
  const botData: PredictionArbBotStatus | null =
    botStatus.status === "fulfilled" ? botStatus.value : null;
  const exchangesData = exchanges.status === "fulfilled" ? exchanges.value : [];

  const abertas = strategiesData.filter((s) => s.positionOpen);

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/20 p-2.5">
            <Activity className="h-6 w-6 text-indigo-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Polymarket Arb</h1>
            <p className="text-sm text-slate-400">
              Arbitragem estrutural + market making em prediction markets
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PredictionHarvestButton
            allowLiveTrading={botData?.allowLiveTrading ?? false}
            isOnline={botData?.isOnline ?? false}
          />
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              botData !== null && botData.isOnline
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/15 text-rose-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                botData !== null && botData.isOnline
                  ? "animate-pulse bg-emerald-400"
                  : "bg-rose-400"
              }`}
            />
            Robô {botData !== null && botData.isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          <PredictionScannerButton settings={settingsData} />
        </div>
      </div>

      <PredictionStatsHeader summary={summaryData} abertasCount={abertas.length} />

      <PredictionSettingsPanel settings={settingsData} />

      <PredictionArbBoard
        strategies={strategiesData}
        trades={tradesData}
        exchangeKeys={exchangesData}
      />
    </div>
  );
}

/**
 * Página principal do Polymarket Arb (Prediction Markets).
 */
export default function PolymarketArbPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-slate-500">Carregando Polymarket Arb...</p>}>
        <PolymarketArbCarregado />
      </Suspense>
    </div>
  );
}
