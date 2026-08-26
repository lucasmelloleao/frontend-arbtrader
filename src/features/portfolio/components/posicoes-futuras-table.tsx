import type { FuturesPosition } from "@/features/portfolio/portfolio.schema";

type PosicoesFuturasTableProps = {
  posicoes: readonly FuturesPosition[];
};

const formatarUsd = (valor: number): string =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Tabela de posições futuras abertas: lado, notional, entry/mark, alavancagem
 * e PnL não realizado. Server Component puro.
 */
export function PosicoesFuturasTable({ posicoes }: PosicoesFuturasTableProps): React.ReactNode {
  const pnlTotal = posicoes.reduce((soma, p) => soma + p.unrealizedPnl, 0);
  const notionalTotal = posicoes.reduce((soma, p) => soma + p.notional, 0);
  const pnlPctTotal = notionalTotal > 0 ? (pnlTotal / notionalTotal) * 100 : 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
        <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
          <tr>
            <th className="px-6 py-4 font-medium">Símbolo / Exchange</th>
            <th className="px-6 py-4 font-medium">Lado</th>
            <th className="px-6 py-4 text-right font-medium">Notional (USD)</th>
            <th className="px-6 py-4 text-right font-medium">Entry / Mark</th>
            <th className="px-6 py-4 text-right font-medium">Alavancagem</th>
            <th className="px-6 py-4 text-right font-medium">PnL Não Realizado</th>
            <th className="px-6 py-4 text-right font-medium">PnL %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {posicoes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                Nenhuma posição futura aberta.
              </td>
            </tr>
          ) : (
            posicoes.map((pos) => {
              const pnl = pos.unrealizedPnl;
              const pnlColor = pnl >= 0 ? "text-emerald-400" : "text-red-400";
              return (
                <tr
                  key={`${pos.exchange}-${pos.symbol}`}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">{pos.symbol}</span>
                    {pos.exchange ? (
                      <span className="ml-2 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-indigo-300">
                        {pos.exchange}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                        pos.side === "long"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {pos.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">
                    ${formatarUsd(pos.notional)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-400">
                    {pos.entryPrice !== null && pos.entryPrice > 0
                      ? pos.entryPrice.toFixed(6)
                      : "—"}
                    {pos.markPrice !== null && pos.markPrice > 0
                      ? ` / ${pos.markPrice.toFixed(6)}`
                      : ""}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-400">{pos.leverage}x</td>
                  <td className={`px-6 py-4 text-right font-mono font-semibold ${pnlColor}`}>
                    {pnl >= 0 ? "+" : ""}${formatarUsd(pnl)}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono ${pnlColor}`}>
                    {pos.unrealizedPnlPct >= 0 ? "+" : ""}
                    {pos.unrealizedPnlPct.toFixed(2)}%
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {posicoes.length > 0 ? (
          <tfoot>
            <tr className="border-t-2 border-slate-700 bg-slate-800/40">
              <td className="px-6 py-4 font-bold text-white">Total</td>
              <td className="px-6 py-4">—</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">
                ${formatarUsd(notionalTotal)}
              </td>
              <td className="px-6 py-4 text-right font-mono text-slate-400">—</td>
              <td className="px-6 py-4 text-right font-mono text-slate-400">—</td>
              <td
                className={`px-6 py-4 text-right font-mono font-bold ${pnlTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {pnlTotal >= 0 ? "+" : ""}${formatarUsd(pnlTotal)}
              </td>
              <td
                className={`px-6 py-4 text-right font-mono font-bold ${pnlTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {pnlPctTotal >= 0 ? "+" : ""}
                {pnlPctTotal.toFixed(2)}%
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
