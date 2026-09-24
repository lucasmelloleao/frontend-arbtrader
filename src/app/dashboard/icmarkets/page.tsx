import { Suspense } from "react";
import { Globe } from "lucide-react";
import { IcMarketsBoard } from "@/features/icmarkets/components/icmarkets-board";
import { IcMarketsSettingsPanel } from "@/features/icmarkets/components/icmarkets-settings-panel";
import { IcMarketsStatsHeader } from "@/features/icmarkets/components/icmarkets-stats-header";
import { IcMarketsTerminalLogs } from "@/features/icmarkets/components/icmarkets-terminal-logs";
import {
  buscarEstrategiasIcMarkets,
  buscarSaldoIcMarkets,
  buscarSettingsIcMarkets,
  buscarStatusIa,
  buscarTradesIcMarkets,
} from "@/features/icmarkets/icmarkets.actions";
import type {
  IcMarketsAiMetadata,
  IcMarketsBalance,
  IcMarketsSettings,
  IcMarketsStrategy,
  IcMarketsTrade,
} from "@/features/icmarkets/icmarkets.schema";

async function IcMarketsCarregado(): Promise<React.ReactNode> {
  const [strategiesRes, openTradesRes, closedTradesRes, settingsRes, balanceRes, aiMetaRes] =
    await Promise.allSettled([
      buscarEstrategiasIcMarkets(),
      buscarTradesIcMarkets({ status: "open" }),
      buscarTradesIcMarkets({ periodo: "today", status: "closed" }),
      buscarSettingsIcMarkets(),
      buscarSaldoIcMarkets(),
      buscarStatusIa(),
    ]);

  const strategies: readonly IcMarketsStrategy[] =
    strategiesRes.status === "fulfilled" && strategiesRes.value.ok
      ? strategiesRes.value.strategies
      : [];
  const openTrades: readonly IcMarketsTrade[] =
    openTradesRes.status === "fulfilled" && openTradesRes.value.ok ? openTradesRes.value.trades : [];
  const closedTrades: readonly IcMarketsTrade[] =
    closedTradesRes.status === "fulfilled" && closedTradesRes.value.ok
      ? closedTradesRes.value.trades
      : [];
  const settings: IcMarketsSettings | null =
    settingsRes.status === "fulfilled" && settingsRes.value.ok ? settingsRes.value.settings : null;
  const balance: IcMarketsBalance | null =
    balanceRes.status === "fulfilled" && balanceRes.value.ok ? balanceRes.value.balance : null;
  const aiMetadata: IcMarketsAiMetadata | null =
    aiMetaRes.status === "fulfilled" && aiMetaRes.value.ok ? aiMetaRes.value.metadata : null;

  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.pnlUsd || 0) > 0).length;
  const totalPnlUsd = closedTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const openPositionsCount = openTrades.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho Estatístico */}
      <IcMarketsStatsHeader
        balanceUsd={balance?.balance ?? 0}
        currency={balance?.currency ?? "USD"}
        accountType={balance?.accountType ?? settings?.accountType ?? "demo"}
        accountId={balance?.accountId ?? settings?.accountId ?? "10102182"}
        leverage={balance?.leverage}
        totalPnlUsd={totalPnlUsd}
        openPositionsCount={openPositionsCount}
        totalTrades={totalTrades}
        winningTrades={winningTrades}
      />

      {/* Painel de Configurações */}
      <IcMarketsSettingsPanel settings={settings} />

      {/* Painel de Operações / Estratégias / IA */}
      <IcMarketsBoard
        strategies={strategies}
        trades={closedTrades}
        initialOpenTrades={openTrades}
        aiMetadata={aiMetadata}
      />

      {/* Terminal de Logs */}
      <IcMarketsTerminalLogs />
    </div>
  );
}

export default function IcMarketsPage(): React.ReactNode {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <Globe className="h-6 w-6 text-indigo-400" /> IC Markets cTrader
          </h1>
          <p className="text-sm text-slate-400">
            Estratégia Quantitativa HFT & IA Meta-Labeling Random Forest (Conta Demo 10102182)
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-12 text-center text-sm text-slate-500">
            Carregando painel IC Markets cTrader...
          </div>
        }
      >
        <IcMarketsCarregado />
      </Suspense>
    </div>
  );
}
