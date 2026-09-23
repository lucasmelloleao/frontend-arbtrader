import { Suspense } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { FxProBoard } from "@/features/fxpro/components/fxpro-board";
import {
  buscarEstrategiasFxPro,
  buscarTradesFxPro,
} from "@/features/fxpro/fxpro.actions";
import { exchangeListSchema } from "@/features/exchanges/exchanges.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

async function FxProDashboardContent(): Promise<React.ReactNode> {
  const [strategiesRes, tradesRes, exchangesRes] = await Promise.allSettled([
    buscarEstrategiasFxPro(),
    buscarTradesFxPro({ periodo: "today" }),
    apiClient(kyServer, API_ENDPOINTS.exchanges.listar, exchangeListSchema),
  ]);

  const strategies =
    strategiesRes.status === "fulfilled" && strategiesRes.value.ok
      ? strategiesRes.value.strategies
      : [];
  const trades =
    tradesRes.status === "fulfilled" && tradesRes.value.ok ? tradesRes.value.trades : [];
  const exchangesData = exchangesRes.status === "fulfilled" ? exchangesRes.value : [];
  const fxProKeys = exchangesData
    .filter((k: any) =>
      ["fxpro", "fxpro-ctrader", "ctrader", "pepperstone"].includes(k.exchangeId),
    )
    .map((k: any) => ({
      id: k.id || k._id,
      exchangeId: k.exchangeId,
      nome: k.name || k.exchangeId,
    }));

  const totalLucro = strategies.reduce((acc, s) => acc + (s.totalProfitUsd || 0), 0);
  const totalTrades = strategies.reduce((acc, s) => acc + (s.totalTrades || 0), 0);
  const posicoesAbertas = strategies.filter((s) => s.currentPositionId).length;

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <span className="text-xs text-slate-400 font-bold uppercase">Posições Abertas</span>
          <div className="mt-1 font-mono text-2xl font-black text-white">{posicoesAbertas}</div>
          <p className="text-[11px] text-slate-500">Gestão contínua em MKT</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <span className="text-xs text-slate-400 font-bold uppercase">Total de Trades</span>
          <div className="mt-1 font-mono text-2xl font-black text-white">{totalTrades}</div>
          <p className="text-[11px] text-slate-500">Execuções auditadas</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <span className="text-xs text-slate-400 font-bold uppercase">Resultado Líquido</span>
          <div
            className={`mt-1 font-mono text-2xl font-black ${
              totalLucro >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {totalLucro >= 0 ? "+" : ""}${totalLucro.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Lucro acumulado</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <span className="text-xs text-slate-400 font-bold uppercase">Filtros Quant / IA</span>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-base font-bold text-indigo-400">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> 4 Gates Ativos
          </div>
          <p className="text-[11px] text-slate-500">VR + ER + Spread + Meta-Label</p>
        </div>
      </div>

      {/* Board com Abas */}
      <FxProBoard
        strategies={strategies}
        trades={trades}
        exchangeKeys={fxProKeys}
      />
    </div>
  );
}

export default function FxProPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-400" />
          <h1 className="text-2xl font-black tracking-tight text-white">
            FxPro cTrader Bot
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Automação de alta frequência em Forex/CFD com filtros de Random Walk, Kaufman ER e Gate 4 (IA Meta-Labeling).
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-xs text-slate-400">
            Carregando painel FxPro cTrader...
          </div>
        }
      >
        <FxProDashboardContent />
      </Suspense>
    </div>
  );
}
