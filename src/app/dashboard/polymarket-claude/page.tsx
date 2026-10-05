import { Suspense } from "react";
import { Activity } from "lucide-react";

import { PolymarketClaudeBoard } from "@/features/polymarket-claude/components/polymarket-claude-board";
import {
  polymarketClaudeBotStatusSchema,
  polymarketClaudeLogsSchema,
  polymarketClaudeSettingsSchema,
  polymarketClaudeStrategyListSchema,
  polymarketClaudeTradeListSchema,
  polymarketClaudeTradesSummarySchema,
  type PolymarketClaudeBotStatus,
  type PolymarketClaudeSettings,
  type PolymarketClaudeStrategy,
  type PolymarketClaudeTrade,
  type PolymarketClaudeTradesSummary,
} from "@/features/polymarket-claude/polymarket-claude.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

async function PolymarketClaudeContent(): Promise<React.ReactNode> {
  const [strategiesRes, tradesRes, settingsRes, tradesResumoRes, botStatusRes, logsRes] =
    await Promise.allSettled([
      apiClient(
        kyServer,
        API_ENDPOINTS.polymarketClaude.listarStrategies,
        polymarketClaudeStrategyListSchema,
      ),
      apiClient(
        kyServer,
        API_ENDPOINTS.polymarketClaude.listarTrades,
        polymarketClaudeTradeListSchema,
      ),
      apiClient(kyServer, API_ENDPOINTS.polymarketClaude.settings, polymarketClaudeSettingsSchema),
      apiClient(
        kyServer,
        API_ENDPOINTS.polymarketClaude.tradesResumo,
        polymarketClaudeTradesSummarySchema,
      ),
      apiClient(
        kyServer,
        API_ENDPOINTS.polymarketClaude.botStatus,
        polymarketClaudeBotStatusSchema,
      ),
      apiClient(kyServer, API_ENDPOINTS.polymarketClaude.logs, polymarketClaudeLogsSchema),
    ]);

  const strategies: PolymarketClaudeStrategy[] =
    strategiesRes.status === "fulfilled" ? strategiesRes.value : [];
  const trades: PolymarketClaudeTrade[] = tradesRes.status === "fulfilled" ? tradesRes.value : [];
  const settings: PolymarketClaudeSettings | null =
    settingsRes.status === "fulfilled" ? settingsRes.value : null;
  const summary: PolymarketClaudeTradesSummary | null =
    tradesResumoRes.status === "fulfilled" ? tradesResumoRes.value : null;
  const botStatus: PolymarketClaudeBotStatus | null =
    botStatusRes.status === "fulfilled" ? botStatusRes.value : null;
  const logs: string[] = logsRes.status === "fulfilled" ? logsRes.value.lines : [];

  return (
    <PolymarketClaudeBoard
      strategies={strategies}
      trades={trades}
      summary={summary}
      settings={settings}
      botStatus={botStatus}
      logs={logs}
    />
  );
}

export default function PolymarketClaudePage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3 text-slate-400">
              <Activity className="h-5 w-5 animate-spin text-purple-500" />
              <span className="text-sm">Carregando dados da Polimarket Claude (RBI)...</span>
            </div>
          </div>
        }
      >
        <PolymarketClaudeContent />
      </Suspense>
    </div>
  );
}
