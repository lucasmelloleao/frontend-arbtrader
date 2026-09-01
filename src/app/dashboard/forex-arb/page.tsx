import { Suspense } from "react";

import { Globe } from "lucide-react";

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

/**
 * Carrega estratégias, trades, oportunidades, configurações, status do robô e
 * corretoras do backend e monta a tela de Arbitragem Forex. Separado da página
 * porque ler o cookie (dentro do `kyServer`) torna a subárvore dinâmica — fica
 * sob `<Suspense>` (streaming, sempre fresco).
 *
 * Cada chamada é capturada individualmente: se um endpoint demorar/estourar o
 * timeout, a seção correspondente mostra estado vazio/aviso em vez de derrubar
 * a página inteira.
 */
async function ForexArbCarregado(): Promise<React.ReactNode> {
  const [strategies, trades, opportunities, settings, botStatus, exchanges] =
    await Promise.allSettled([
      apiClient(kyServer, API_ENDPOINTS.forexArb.listarStrategies, forexArbStrategyListSchema),
      apiClient(kyServer, API_ENDPOINTS.forexArb.listarTrades, forexArbTradeListSchema),
      apiClient(kyServer, API_ENDPOINTS.forexArb.oportunidades, forexArbOpportunityListSchema),
      apiClient(kyServer, API_ENDPOINTS.forexArb.settings, forexArbSettingsSchema),
      apiClient(kyServer, API_ENDPOINTS.perpArb.botStatus, botStatusSchema, {
        method: "get",
        searchParams: { botName: "forex-arb" },
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

  const abertas = strategiesData.filter((s) => s.positionOpen);
  const encerradas = tradesData.filter((t) => t.type === "close" && t.status === "executed");
  const totalPnl = encerradas.reduce((acc, t) => acc + t.realizedPnl, 0);
  const melhorOportunidade = opportunitiesData.reduce<ForexArbTrade | null>((melhor, atual) => {
    if (melhor === null || atual.expectedProfitPct > melhor.expectedProfitPct) {
      return atual;
    }
    return melhor;
  }, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/20 p-2.5">
            <Globe className="h-6 w-6 text-indigo-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Arbitragem Forex</h1>
            <p className="text-sm text-slate-400">
              Arbitragem simples e triangular dentro da corretora
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              botData !== null && botData.isOnline
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-red-500/30 bg-red-500/15 text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                botData !== null && botData.isOnline ? "animate-pulse bg-emerald-400" : "bg-red-400"
              }`}
            />
            Robô {botData !== null && botData.isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          <ForexScannerButton settings={settingsData} />
        </div>
      </div>

      <ForexStatsHeader
        oportunidades={opportunitiesData.length}
        abertas={abertas.length}
        encerradas={encerradas.length}
        totalPnl={totalPnl}
        melhorOportunidadePct={
          melhorOportunidade !== null ? melhorOportunidade.expectedProfitPct : null
        }
      />

      <ForexSettingsPanel settings={settingsData} exchangeIds={exchangeIds} />

      <ForexArbBoard
        strategies={strategiesData}
        trades={tradesData}
        opportunities={opportunitiesData}
        exchangeIds={exchangeIds}
        exchangeKeys={exchangesData}
      />

      <ForexTerminalLogs />
    </div>
  );
}

/**
 * Arbitragem Forex (simples e triangular via cTrader/FIX): estatísticas,
 * operações em aberto/encerradas, oportunidades, configurações, credenciais
 * cTrader e terminal de logs. Leitura é RSC paralela; mutações são Server
 * Actions com `revalidatePath`.
 */
export default function ForexArbPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-slate-500">Carregando arbitragem forex...</p>}>
        <ForexArbCarregado />
      </Suspense>
    </div>
  );
}
