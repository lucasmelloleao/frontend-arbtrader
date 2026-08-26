import type { PortfolioResumo } from "@/features/portfolio/portfolio.schema";

type ResumoCardsProps = {
  resumo: PortfolioResumo;
};

const formatarUsd = (valor: number): string =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Cards de resumo patrimonial: corretoras conectadas, saldo spot e saldo
 * futuros. Server Component puro — recebe o resumo validado por prop.
 */
export function ResumoCards({ resumo }: ResumoCardsProps): React.ReactNode {
  const patrimonioGlobal = resumo.spotTotalEquity + resumo.futuresTotalEquity;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-400">Corretoras Conectadas</p>
          <p className="text-3xl font-bold text-white">{resumo.exchanges.length}</p>
        </div>
        <p className="mt-2 border-t border-slate-800/80 pt-2 font-mono text-xs text-slate-400">
          Patrimônio Global:{" "}
          <strong className="font-bold text-white">${formatarUsd(patrimonioGlobal)}</strong>
        </p>
      </div>

      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-500/20 bg-slate-900 p-6 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
        <div className="relative">
          <p className="mb-1 text-sm font-medium text-emerald-400">🟢 Saldo Total Spot</p>
          <p className="text-3xl font-bold text-emerald-300">
            ${formatarUsd(resumo.spotTotalEquity)}
          </p>
        </div>
        <p className="relative z-10 mt-2 border-t border-emerald-500/10 pt-2 font-mono text-xs text-emerald-400/80">
          Disponível em:{" "}
          <strong className="font-bold text-emerald-300">${formatarUsd(resumo.spotUsdt)}</strong>
        </p>
      </div>

      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-indigo-500/20 bg-slate-900 p-6 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
        <div className="relative">
          <p className="mb-1 text-sm font-medium text-indigo-400">🟣 Saldo Total Futuros</p>
          <p className="text-3xl font-bold text-indigo-300">
            ${formatarUsd(resumo.futuresTotalEquity)}
          </p>
        </div>
        <p className="relative z-10 mt-2 border-t border-indigo-500/10 pt-2 font-mono text-xs text-indigo-400/80">
          Disponível em:{" "}
          <strong className="font-bold text-indigo-300">${formatarUsd(resumo.futuresUsdt)}</strong>
        </p>
      </div>
    </div>
  );
}
