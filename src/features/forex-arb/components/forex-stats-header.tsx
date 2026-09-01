import { Activity, CircleCheckBig, Globe, TrendingUp } from "lucide-react";

type ForexStatsHeaderProps = {
  /** Número de oportunidades detectadas. */
  oportunidades: number;
  /** Número de posições abertas. */
  abertas: number;
  /** Número de operações encerradas. */
  encerradas: number;
  /** PnL realizado somado dos fechamentos. */
  totalPnl: number;
  /** Melhor retorno esperado entre as oportunidades (%). */
  melhorOportunidadePct: number | null;
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

/**
 * Cards de estatísticas da arbitragem Forex: oportunidades, posições abertas,
 * operações encerradas e PnL realizado. Server Component puro.
 */
export function ForexStatsHeader({
  oportunidades,
  abertas,
  encerradas,
  totalPnl,
  melhorOportunidadePct,
}: ForexStatsHeaderProps): React.ReactNode {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Activity className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Oportunidades
        </div>
        <div className="mt-1 text-2xl font-black text-white">{oportunidades}</div>
        {melhorOportunidadePct !== null ? (
          <div className="mt-1 font-mono text-[11px] text-emerald-400">
            Melhor: +{melhorOportunidadePct.toFixed(3)}%
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-slate-500">Detectadas pelo scanner</div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Globe className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Posições Abertas
        </div>
        <div className="mt-1 text-2xl font-black text-white">{abertas}</div>
        <div className="mt-1 text-[11px] text-slate-500">Arbitragens em andamento</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <CircleCheckBig className="h-4 w-4 text-cyan-400" aria-hidden="true" /> Operações Fechadas
        </div>
        <div className="mt-1 text-2xl font-black text-white">{encerradas}</div>
        <div className="mt-1 text-[11px] text-slate-500">Ciclos concluídos</div>
      </div>

      <div
        className={`rounded-xl border p-5 ${
          totalPnl >= 0
            ? "border-emerald-500/30 bg-emerald-950/20"
            : "border-red-500/30 bg-red-950/20"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <TrendingUp
            className={`h-4 w-4 ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
            aria-hidden="true"
          />{" "}
          PnL Realizado
        </div>
        <div
          className={`mt-1 font-mono text-2xl font-black ${
            totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {fmtUsd(totalPnl)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Soma dos fechamentos</div>
      </div>
    </div>
  );
}
