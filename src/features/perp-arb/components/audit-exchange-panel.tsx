"use client";

import { useState } from "react";

import { Search } from "lucide-react";

import { buscarAuditExchange } from "@/features/perp-arb/perp-arb.actions";
import type { PerpArbAuditExchange } from "@/features/perp-arb/perp-arb.schema";
import { AUDITABLE_CEX_IDS, SUPPORTED_CEX } from "@/shared/constants/supported-cex";

/** Corretoras spot/perp com auditoria disponível (cTrader/Pepperstone ficam de fora). */
const CORRETORAS_AUDITAVEIS = SUPPORTED_CEX.filter((cex) => AUDITABLE_CEX_IDS.includes(cex.id));

/** Períodos disponíveis para a auditoria (em dias). */
const PERIODOS = [1, 3, 5, 7, 15, 30] as const;

const fmtUsd = (valor: number): string =>
  `${valor >= 0 ? "+" : "-"}$${Math.abs(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtNum = (valor: number): string =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtP = (valor: number): string => (valor < 0.1 ? valor.toFixed(6) : valor.toFixed(4));

/**
 * Painel de auditoria da corretora: seleciona a exchange e o período (dias
 * retroativos) e consulta o `/perp-arb/audit-exchange`, que cruza os trades
 * reais de Spot + Perpétuo, taxas e resultado líquido. Client component porque
 * a busca depende da seleção do usuário (Server Action + estado local).
 */
export function AuditExchangePanel(): React.ReactNode {
  const [exchange, setExchange] = useState<string>(CORRETORAS_AUDITAVEIS[0].id);
  const [days, setDays] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [relatorio, setRelatorio] = useState<PerpArbAuditExchange | null>(null);

  const executar = async (): Promise<void> => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await buscarAuditExchange(exchange, days);
      if (!resultado.ok) {
        setErro(resultado.erro);
        setRelatorio(null);
        return;
      }
      setRelatorio(resultado.dados);
    } catch {
      setErro("Não foi possível gerar o relatório. O backend pode estar indisponível.");
      setRelatorio(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">🧾 Auditoria de Trades por Corretora</h3>
          <p className="text-sm text-gray-400">
            Cruzamento das operações reais de Spot + Perpétuo, taxas e lucro/prejuízo no período.
          </p>
        </div>
      </div>

      {/* Seletor de corretora + período */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300">
          Corretora
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          >
            {CORRETORAS_AUDITAVEIS.map((cex) => (
              <option key={cex.id} value={cex.id}>
                {cex.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300">
          Período
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          >
            {PERIODOS.map((d) => (
              <option key={d} value={d}>
                Últimos {d} {d === 1 ? "dia" : "dias"}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void executar()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {loading ? "Gerando..." : "Gerar Relatório"}
        </button>
      </div>

      {erro !== null ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          ⚠️ {erro}
        </div>
      ) : null}

      {relatorio !== null ? (
        <div className="space-y-4">
          {/* Resumo do período */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-white">
              {relatorio.exchange}
            </span>
            <span>
              Período: {new Date(relatorio.startDate).toLocaleDateString()} →{" "}
              {new Date(relatorio.endDate).toLocaleDateString()} ({relatorio.periodDays} dias)
            </span>
          </div>

          {/* Cards de totais */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                PnL Spot
              </span>
              <div
                className={`mt-1 text-xl font-black ${relatorio.totais.totalPnlSpot >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {fmtUsd(relatorio.totais.totalPnlSpot)}
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                PnL Perpétuo
              </span>
              <div
                className={`mt-1 text-xl font-black ${relatorio.totais.totalPnlPerp >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {fmtUsd(relatorio.totais.totalPnlPerp)}
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Taxas (Spot + Perp)
              </span>
              <div className="mt-1 text-xl font-black text-amber-300">
                {fmtUsd(relatorio.totais.totalTaxasTaker)}
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Resultado Líquido
              </span>
              <div
                className={`mt-1 text-xl font-black ${relatorio.totais.resultadoLiquidoTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {fmtUsd(relatorio.totais.resultadoLiquidoTotal)}
              </div>
            </div>
          </div>

          {/* Detalhe por ativo */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Ativo</th>
                  <th className="px-4 py-3 text-right font-medium">Entrada Spot</th>
                  <th className="px-4 py-3 text-right font-medium">Saída Spot</th>
                  <th className="px-4 py-3 text-right font-medium">PnL Spot</th>
                  <th className="px-4 py-3 text-right font-medium">PnL Perp</th>
                  <th className="px-4 py-3 text-right font-medium">Taxas</th>
                  <th className="px-4 py-3 text-right font-medium">Resultado Líquido</th>
                  <th className="px-4 py-3 text-right font-medium">Trades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {relatorio.detalhesPorAtivo.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Nenhum trade encontrado no período.
                    </td>
                  </tr>
                ) : (
                  relatorio.detalhesPorAtivo.map((ativo) => (
                    <tr key={ativo.symbol} className="transition-colors hover:bg-slate-800/30">
                      <td colSpan={8} className="p-0">
                        <details className="group" aria-label={`Operações de ${ativo.symbol}`}>
                          <summary className="grid cursor-pointer list-none grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_0.6fr] items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                            <span className="flex items-center gap-2 font-bold text-white">
                              <span className="text-[10px] text-indigo-400 transition-transform group-open:rotate-90">
                                ▶
                              </span>
                              {ativo.symbol}
                            </span>
                            <span className="text-right font-mono text-slate-300">
                              ${fmtNum(ativo.volumeEntradaSpot)}
                            </span>
                            <span className="text-right font-mono text-slate-300">
                              ${fmtNum(ativo.volumeSaidaSpot)}
                            </span>
                            <span
                              className={`text-right font-mono font-bold ${ativo.pnlBrutoSpot >= 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {fmtUsd(ativo.pnlBrutoSpot)}
                            </span>
                            <span
                              className={`text-right font-mono font-bold ${ativo.pnlBrutoPerp >= 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {fmtUsd(ativo.pnlBrutoPerp)}
                            </span>
                            <span className="text-right font-mono text-amber-300">
                              {fmtUsd(ativo.totalTaxas)}
                            </span>
                            <span
                              className={`text-right font-mono font-bold ${ativo.resultadoLiquidoReal >= 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {fmtUsd(ativo.resultadoLiquidoReal)}
                            </span>
                            <span className="text-right font-mono text-slate-400">
                              {ativo.tradesCount}
                            </span>
                          </summary>
                          <div className="overflow-x-auto border-t border-slate-800/70 bg-slate-950/60">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                              <thead className="border-b border-slate-800 bg-slate-900/40 text-slate-500">
                                <tr>
                                  <th className="px-4 py-2 font-medium">Tipo</th>
                                  <th className="px-4 py-2 font-medium">Lado</th>
                                  <th className="px-4 py-2 text-right font-medium">Data</th>
                                  <th className="px-4 py-2 text-right font-medium">Qtd</th>
                                  <th className="px-4 py-2 text-right font-medium">Preço</th>
                                  <th className="px-4 py-2 text-right font-medium">Volume USD</th>
                                  <th className="px-4 py-2 text-right font-medium">Taxa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {(ativo.trades ?? []).length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-4 py-4 text-center text-slate-500"
                                    >
                                      Sem detalhe de execuções para este ativo.
                                    </td>
                                  </tr>
                                ) : (
                                  (ativo.trades ?? []).map((trade) => (
                                    <tr key={trade.id} className="hover:bg-slate-900/40">
                                      <td className="px-4 py-2">
                                        <span
                                          className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                                            trade.type === "SPOT"
                                              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                                              : "border-purple-500/30 bg-purple-500/20 text-purple-300"
                                          }`}
                                        >
                                          {trade.type}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <span
                                          className={`font-mono font-bold ${
                                            trade.side === "BUY" || trade.side === "OPEN_SHORT"
                                              ? "text-emerald-400"
                                              : "text-red-400"
                                          }`}
                                        >
                                          {trade.side}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-300">
                                        {new Date(trade.time).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-300">
                                        {trade.amount}
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-300">
                                        ${fmtP(trade.price)}
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono text-slate-300">
                                        ${fmtNum(trade.volumeUsd)}
                                      </td>
                                      <td className="px-4 py-2 text-right font-mono text-amber-300">
                                        {fmtUsd(trade.feeUsd)}
                                        {trade.feeCurrency !== null &&
                                        trade.feeCurrency !== undefined ? (
                                          <span className="ml-1 text-[10px] text-slate-500">
                                            ({trade.feeCurrency})
                                          </span>
                                        ) : null}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
          Selecione a corretora e o período e clique em{" "}
          <b className="text-indigo-400">"Gerar Relatório"</b> para auditar as operações.
        </div>
      )}
    </div>
  );
}
