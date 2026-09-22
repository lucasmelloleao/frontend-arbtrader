import { Suspense } from "react";

import { Activity } from "lucide-react";

import { DerivBoard } from "@/features/deriv/components/deriv-board";
import { DerivSettingsPanel } from "@/features/deriv/components/deriv-settings-panel";
import { DerivTerminalLogs } from "@/features/deriv/components/deriv-terminal-logs";
import {
  derivBalanceSchema,
  derivSettingsSchema,
  derivTradeListSchema,
  derivStrategyListSchema,
  derivTradesSummarySchema,
  type DerivBalance,
  type DerivSettings,
  type DerivStrategy,
  type DerivTrade,
  type DerivTradesSummary,
} from "@/features/deriv/deriv.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

async function DerivPageContent(): Promise<React.ReactNode> {
  const [settingsRes, summaryRes, tradesRes, balanceRes, strategiesRes] = await Promise.allSettled([
    apiClient(kyServer, API_ENDPOINTS.deriv.settings, derivSettingsSchema),
    apiClient(kyServer, API_ENDPOINTS.deriv.summary, derivTradesSummarySchema),
    apiClient(kyServer, API_ENDPOINTS.deriv.listarTrades, derivTradeListSchema),
    apiClient(kyServer, API_ENDPOINTS.deriv.balance, derivBalanceSchema),
    apiClient(kyServer, API_ENDPOINTS.deriv.strategies, derivStrategyListSchema),
  ]);

  const settings: DerivSettings | null =
    settingsRes.status === "fulfilled" ? settingsRes.value : null;
  const summary: DerivTradesSummary | null =
    summaryRes.status === "fulfilled" ? summaryRes.value : null;
  const trades: DerivTrade[] = tradesRes.status === "fulfilled" ? tradesRes.value : [];
  const balance: DerivBalance | null =
    balanceRes.status === "fulfilled" ? balanceRes.value : null;
  const strategies: DerivStrategy[] =
    strategiesRes.status === "fulfilled" ? strategiesRes.value : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/20 p-2.5">
            <Activity className="h-6 w-6 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Deriv Bot</h1>
            <p className="text-sm text-slate-400">
              Robô de Opções Digitais Deriv (Rise/Fall, Directional & Early Profit Take)
            </p>
          </div>
        </div>
      </div>

      <DerivSettingsPanel settings={settings} />

      <DerivBoard summary={summary} trades={trades} balance={balance} strategies={strategies} />

      <DerivTerminalLogs />
    </div>
  );
}

export default function DerivPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-slate-500">Carregando Deriv Bot...</p>}>
        <DerivPageContent />
      </Suspense>
    </div>
  );
}
