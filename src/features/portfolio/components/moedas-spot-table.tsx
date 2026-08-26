import type { SpotCoin } from "@/features/portfolio/portfolio.schema";

type MoedasSpotTableProps = {
  moedas: readonly SpotCoin[];
};

const formatarUsd = (valor: number): string =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatarQtd = (valor: number): string =>
  valor.toLocaleString("pt-BR", { maximumFractionDigits: 6 });

/**
 * Tabela de moedas spot: quantidade, valor USD, custo médio e PnL por ativo.
 * Server Component puro — recebe as moedas validadas por prop.
 */
export function MoedasSpotTable({ moedas }: MoedasSpotTableProps): React.ReactNode {
  const totalUsd = moedas.reduce((soma, m) => soma + m.usdValue, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
        <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
          <tr>
            <th className="px-6 py-4 font-medium">Moeda / Exchange</th>
            <th className="px-6 py-4 text-right font-medium">Quantidade</th>
            <th className="px-6 py-4 text-right font-medium">Preço Médio</th>
            <th className="px-6 py-4 text-right font-medium">Valor (USD)</th>
            <th className="px-6 py-4 text-right font-medium">Lucro/Prejuízo</th>
            <th className="px-6 py-4 text-right font-medium">% do Spot</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {moedas.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                Nenhuma moeda spot com saldo.
              </td>
            </tr>
          ) : (
            moedas.map((moeda) => {
              const pnl = moeda.pnl;
              const pnlColor = pnl >= 0 ? "text-emerald-400" : "text-red-400";
              const pct = totalUsd > 0 ? (moeda.usdValue / totalUsd) * 100 : 0;
              return (
                <tr
                  key={`${moeda.exchange}-${moeda.asset}`}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">{moeda.asset}</span>
                    {moeda.exchange ? (
                      <span className="ml-2 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-indigo-300">
                        {moeda.exchange}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">
                    {formatarQtd(moeda.total)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-400">
                    {moeda.avgCostPrice !== null && moeda.avgCostPrice > 0
                      ? `$${moeda.avgCostPrice.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 8 })}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-400">
                    ${formatarUsd(moeda.usdValue)}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-semibold ${pnlColor}`}>
                    <div className="flex flex-col items-end leading-tight">
                      <span>
                        {pnl >= 0 ? "+" : ""}${formatarUsd(Math.abs(pnl))}
                      </span>
                      {moeda.pnlPct !== null ? (
                        <span className={`text-[11px] ${pnlColor}`}>
                          {moeda.pnlPct >= 0 ? "+" : ""}
                          {moeda.pnlPct.toFixed(2)}%
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-400">
                    {pct.toFixed(2)}%
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
