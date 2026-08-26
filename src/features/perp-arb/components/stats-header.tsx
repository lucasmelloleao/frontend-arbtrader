import { Activity, DollarSign, TrendingUp, Wallet } from "lucide-react";

/** Saldo de uma corretora (shape do `/portfolio/resumo`). */
type ExchangeBalance = {
  id: string;
  name: string;
  exchangeId: string;
  spotUsdt: number;
  spotUsdc: number;
  spotTotalEquity: number;
  futuresUsdt: number;
  futuresUsdc: number;
  futuresTotalEquity: number;
};

type StatsHeaderProps = {
  openCount: number;
  totalMonitored: number;
  executedCount: number;
  totalPnl: number;
  spotUsdt: number;
  spotUsdc: number;
  futuresUsdt: number;
  futuresUsdc: number;
  exchanges: readonly ExchangeBalance[];
  globalClosedApr: number | null;
  monthlyPct: number | null;
  totalEntryVolume: number;
  totalExitVolume: number;
};

/** Resolve o nome amigável da corretora. */
function exchangeLabel(ex: ExchangeBalance): string {
  const rawName = ex.name.trim();
  return rawName || ex.exchangeId;
}

/** Card de saldo spot (LONG). */
function SpotCard({
  label,
  usdt,
  usdc,
}: {
  label: string;
  usdt: number;
  usdc: number;
}): React.ReactNode {
  return (
    <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-lg">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          <Wallet className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Saldo Livre Spot (
          {label})
        </div>
        <div className="mt-2 flex items-baseline gap-2 text-2xl font-black text-white sm:text-3xl">
          ${usdt.toFixed(2)} <span className="text-xs font-semibold text-emerald-400">USDT</span>
          {usdc > 0 ? (
            <span className="text-sm font-normal text-slate-400">/ ${usdc.toFixed(2)} USDC</span>
          ) : null}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Disponível para ordens de compra Spot</div>
      </div>
      <div className="hidden text-right sm:block">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
          Spot LONG
        </span>
      </div>
    </div>
  );
}

/** Card de saldo futuros (SHORT). */
function FuturesCard({
  label,
  usdt,
  usdc,
}: {
  label: string;
  usdt: number;
  usdc: number;
}): React.ReactNode {
  return (
    <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 shadow-lg">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
          <Wallet className="h-4 w-4 text-purple-400" aria-hidden="true" /> Saldo Livre Futuros (
          {label})
        </div>
        <div className="mt-2 flex items-baseline gap-2 text-2xl font-black text-white sm:text-3xl">
          ${usdt.toFixed(2)} <span className="text-xs font-semibold text-purple-400">USDT</span>
          {usdc > 0 ? (
            <span className="text-sm font-normal text-slate-400">/ ${usdc.toFixed(2)} USDC</span>
          ) : null}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Margem livre para ordens de Short Perpétuo
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
          Perp SHORT
        </span>
      </div>
    </div>
  );
}

/**
 * Cabeçalho de estatísticas: saldos por corretora + métricas do robô (em
 * aberto, encerradas com APR, P&L total). Server Component puro.
 */
export function StatsHeader({
  openCount,
  totalMonitored,
  executedCount,
  totalPnl,
  spotUsdt,
  spotUsdc,
  futuresUsdt,
  futuresUsdc,
  exchanges,
  globalClosedApr,
  monthlyPct,
  totalEntryVolume,
  totalExitVolume,
}: StatsHeaderProps): React.ReactNode {
  const hasBreakdown = exchanges.length > 0;

  return (
    <div className="space-y-4">
      {/* Saldos por corretora */}
      {hasBreakdown ? (
        exchanges
          .filter((ex) => ex.spotUsdt + ex.spotUsdc + ex.futuresUsdt + ex.futuresUsdc > 0)
          .map((ex) => {
            const label = exchangeLabel(ex);
            return (
              <div key={ex.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    <Wallet className="mr-2 inline h-4 w-4 text-indigo-400" aria-hidden="true" />
                    {label}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SpotCard label={label} usdt={ex.spotUsdt} usdc={ex.spotUsdc} />
                  <FuturesCard label={label} usdt={ex.futuresUsdt} usdc={ex.futuresUsdc} />
                </div>
              </div>
            );
          })
      ) : spotUsdt + spotUsdc + futuresUsdt + futuresUsdc > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SpotCard label="CEX" usdt={spotUsdt} usdc={spotUsdc} />
          <FuturesCard label="Perpétuo" usdt={futuresUsdt} usdc={futuresUsdc} />
        </div>
      ) : null}

      {/* Métricas do robô */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400">
            <Activity className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Operações em Aberto
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{openCount}</div>
          <div className="text-xs text-gray-500">de {totalMonitored} monitoradas</div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400">
              <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Operações
              Encerradas
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-white">{executedCount}</div>
              {globalClosedApr !== null && globalClosedApr > 0 ? (
                <div className="flex flex-col items-end">
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
                    📈 APR: +{globalClosedApr.toFixed(1)}% a.a.
                  </span>
                  {monthlyPct !== null && monthlyPct > 0 ? (
                    <span className="mt-1 pr-1 text-[11px] font-extrabold text-emerald-400">
                      📅 +{monthlyPct.toFixed(1)}% a.m.
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {totalEntryVolume > 0 ? (
              <span>
                Entrada: ${totalEntryVolume.toFixed(2)} → Saída: ${totalExitVolume.toFixed(2)}
              </span>
            ) : (
              "histórico de encerramentos"
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400">
            <DollarSign className="h-4 w-4 text-cyan-400" aria-hidden="true" /> P&L Total
          </div>
          <div
            className={`mt-2 text-3xl font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {totalPnl.toFixed(2)} USDT
          </div>
          <div className="text-xs text-gray-500">realizado</div>
        </div>
      </div>
    </div>
  );
}
