import type { ExchangeBalance } from "@/features/portfolio/portfolio.schema";
import { SUPPORTED_CEX } from "@/shared/constants/supported-cex";

type CorretorasTableProps = {
  corretoras: readonly ExchangeBalance[];
};

const formatarUsd = (valor: number): string =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Resolve o nome amigável da corretora (registry const). */
function nomeCorretora(exchangeId: string): string {
  return SUPPORTED_CEX.find((cex) => cex.id === exchangeId)?.nome ?? exchangeId;
}

/**
 * Tabela de saldos das corretoras conectadas: spot, futuros e total por
 * exchange. Server Component puro.
 */
export function CorretorasTable({ corretoras }: CorretorasTableProps): React.ReactNode {
  const totalGeral = corretoras.reduce(
    (soma, c) => soma + c.spotTotalEquity + c.futuresTotalEquity,
    0,
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
        <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
          <tr>
            <th className="px-6 py-4 font-medium">Exchange</th>
            <th className="px-6 py-4 text-right font-medium">Saldo Spot (USDT / USDC)</th>
            <th className="px-6 py-4 text-right font-medium">Saldo Futuros (USDT / USDC)</th>
            <th className="px-6 py-4 text-right font-medium">Total USD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {corretoras.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                Nenhuma corretora conectada.
              </td>
            </tr>
          ) : (
            corretoras.map((corretora) => {
              const total = corretora.spotTotalEquity + corretora.futuresTotalEquity;
              return (
                <tr key={corretora.id} className="transition-colors hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-medium capitalize text-white">
                    {corretora.name || nomeCorretora(corretora.exchangeId)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-400">
                    ${formatarUsd(corretora.spotTotalEquity)}
                    <span className="ml-1 text-[11px] font-normal text-slate-500">
                      ({formatarUsd(corretora.spotUsdt)} / {formatarUsd(corretora.spotUsdc)})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-indigo-400">
                    ${formatarUsd(corretora.futuresTotalEquity)}
                    <span className="ml-1 text-[11px] font-normal text-slate-500">
                      ({formatarUsd(corretora.futuresUsdt)} / {formatarUsd(corretora.futuresUsdc)})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-base font-bold text-white">
                    ${formatarUsd(total)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {corretoras.length > 0 ? (
          <tfoot>
            <tr className="border-t-2 border-slate-700 bg-slate-800/40">
              <td className="px-6 py-4 font-bold text-white">Total</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                ${formatarUsd(corretoras.reduce((soma, c) => soma + c.spotTotalEquity, 0))}
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-indigo-400">
                ${formatarUsd(corretoras.reduce((soma, c) => soma + c.futuresTotalEquity, 0))}
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">
                ${formatarUsd(totalGeral)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
