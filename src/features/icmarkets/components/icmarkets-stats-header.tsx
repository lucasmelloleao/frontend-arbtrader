"use client";

import { DollarSign, TrendingUp, Activity, CheckCircle, Percent } from "lucide-react";

type IcMarketsStatsHeaderProps = {
  balanceUsd: number;
  currency?: string;
  accountType?: string;
  accountId?: string;
  leverage?: number;
  totalPnlUsd: number;
  openPositionsCount: number;
  totalTrades: number;
  winningTrades: number;
};

export function IcMarketsStatsHeader({
  balanceUsd,
  currency = "USD",
  accountType = "demo",
  accountId = "10102182",
  leverage,
  totalPnlUsd,
  openPositionsCount,
  totalTrades,
  winningTrades,
}: IcMarketsStatsHeaderProps): React.ReactNode {
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0.0";
  const pnlColor = totalPnlUsd >= 0 ? "text-emerald-400" : "text-rose-400";
  const pnlPrefix = totalPnlUsd >= 0 ? "+$" : "-$";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Saldo Disponível */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Saldo Disponível</span>
          <div className="flex items-center gap-1.5">
            {leverage !== undefined && (
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                1:{leverage}
              </span>
            )}
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">
            $
            {balanceUsd.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-semibold text-slate-400">{currency}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Conta{" "}
          <b
            className={
              accountType === "live" ? "text-rose-400 uppercase" : "text-emerald-400 uppercase"
            }
          >
            {accountType}
          </b>{" "}
          {accountId ? `(#${accountId})` : ""}
        </p>
      </div>

      {/* 2. PnL Total Realizado */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">PnL Total Realizado</span>
          <div
            className={`rounded-lg p-2 ${totalPnlUsd >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
          >
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${pnlColor}`}>
            {pnlPrefix}
            {Math.abs(totalPnlUsd).toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-slate-400">USD</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Operações cTrader IC Markets</p>
      </div>

      {/* 3. Posições Ativas */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Posições Ativas</span>
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{openPositionsCount}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Gestão TP/SL/Trailing em tempo real</p>
      </div>

      {/* 4. Operações Encerradas */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Operações Encerradas</span>
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{totalTrades}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{winningTrades} vitórias registradas</p>
      </div>

      {/* 5. Win Rate */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Taxa de Acerto (Win Rate)</span>
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-purple-400">{winRate}%</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Filtrado pelo Gate 4 IA Meta-Labeler</p>
      </div>
    </div>
  );
}
