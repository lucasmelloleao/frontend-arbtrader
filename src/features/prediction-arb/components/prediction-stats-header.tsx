import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Gauge,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type { PredictionArbTradesSummary } from "@/features/prediction-arb/prediction-arb.schema";

type PredictionStatsHeaderProps = {
  summary: PredictionArbTradesSummary | null;
  abertasCount: number;
  saldoDisponivel: number;
  simulatedPnl: number;
  simulatedCount: number;
  isOnline: boolean;
  isLive: boolean;
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
const fmtPct = (v: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

/**
 * Cards superiores com estatísticas do Polymarket Arb: Saldo Disponível, Total PnL,
 * Posições Abertas, Operações Encerradas e Retorno / APR.
 */
export function PredictionStatsHeader({
  summary,
  abertasCount,
  saldoDisponivel,
  simulatedPnl,
  simulatedCount,
  isOnline,
  isLive,
}: PredictionStatsHeaderProps): React.ReactNode {
  const totalPnl = summary?.totalPnl ?? 0;
  const operacoesEncerradas = summary?.operacoesEncerradas ?? 0;
  const aprPct = summary?.aprPct ?? 0;
  const totalEntradaUsd = summary?.totalEntradaUsd ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Saldo Disponível (deposit wallet on-chain) */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Saldo Disponível</span>
          <Wallet className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-emerald-400">
          ${saldoDisponivel.toFixed(2)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">pUSD na deposit wallet (Polymarket)</div>
      </div>

      {/* Total PnL */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>PnL Total Realizado</span>
          <DollarSign className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        </div>
        <div
          className={`mt-2 font-mono text-2xl font-black ${
            totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {fmtUsd(totalPnl)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Volume negociado: ${totalEntradaUsd.toLocaleString()} USDT
        </div>
      </div>

      {/* Posições Abertas */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Posições Ativas</span>
          <Activity className="h-4 w-4 text-indigo-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-white">{abertasCount}</div>
        <div className="mt-1 text-[11px] text-slate-500">Pares YES/NO em monitoramento</div>
      </div>

      {/* Operações Encerradas */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Operações Encerradas</span>
          <CheckCircle2 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-white">{operacoesEncerradas}</div>
        <div className="mt-1 text-[11px] text-slate-500">A partir de 15/09/2026</div>
      </div>

      {/* APR Estimado */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Retorno Anualizado (APR)</span>
          <TrendingUp className="h-4 w-4 text-amber-400" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline gap-1 font-mono text-2xl font-black text-amber-400">
          {fmtPct(aprPct)}
          <ArrowUpRight className="h-4 w-4 text-amber-400" aria-hidden="true" />
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Estimado com base em spreads capturados
        </div>
      </div>

      {/* PnL Estimado (Simulado) */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            PnL Estimado (Simulado)
          </span>
          <Activity className="h-4 w-4 text-sky-400" aria-hidden="true" />
        </div>
        <div
          className={`mt-2 font-mono text-2xl font-black ${
            simulatedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {fmtUsd(simulatedPnl)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 font-mono">
          {simulatedCount} operação(simuladas) sem consumir saldo real
        </div>
      </div>

      {/* Estado do Motor */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Estado do Motor</span>
          <Gauge className="h-4 w-4 text-indigo-400" aria-hidden="true" />
        </div>
        <div
          className={`mt-2 font-mono text-2xl font-black ${
            !isOnline ? "text-slate-500" : isLive ? "text-rose-400" : "text-sky-400"
          }`}
        >
          {!isOnline ? "OFFLINE" : isLive ? "LIVE" : "SIMULANDO"}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {isOnline
            ? isLive
              ? "Ordens reais ativas"
              : "Dry-run ativo (saldo intacto)"
            : "Scanner desligado"}
        </div>
      </div>
    </div>
  );
}
