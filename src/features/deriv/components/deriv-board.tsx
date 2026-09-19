"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { RefreshCw, XCircle } from "lucide-react";

import { fecharPosicaoDeriv, syncTradesDeriv } from "@/features/deriv/deriv.actions";
import type { DerivTrade, DerivTradesSummary } from "@/features/deriv/deriv.schema";

type DerivBoardProps = {
  summary: DerivTradesSummary | null;
  trades: readonly DerivTrade[];
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

export function DerivBoard({ summary, trades }: DerivBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"open" | "closed">("open");

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const activeTrades = trades.filter((t) => t.status === "open" || t.status === "pending");
  const closedTrades = trades.filter((t) => t.status !== "open" && t.status !== "pending");

  const totalTrades = summary?.operacoesEncerradas ?? closedTrades.length;
  const totalPnl = summary?.totalPnl ?? 0;
  const winRate = summary?.winRate ?? 0;

  const handleSync = (): void => {
    startTransition(async () => {
      await syncTradesDeriv();
      router.refresh();
    });
  };

  const handleClosePosition = (trade: DerivTrade): void => {
    if (!confirm(`Encerrar antecipadamente o contrato ${trade.contractId}?`)) return;
    startTransition(async () => {
      await fecharPosicaoDeriv(trade.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total de Trades
          </span>
          <div className="mt-1 text-2xl font-bold text-foreground">{totalTrades}</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Resultado Total (P/L)
          </span>
          <div
            className={`mt-1 text-2xl font-bold ${
              totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {fmtUsd(totalPnl)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Taxa de Acerto (Win Rate)
          </span>
          <div className="mt-1 text-2xl font-bold text-foreground">{winRate.toFixed(1)}%</div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ações Rápidas
            </span>
            <div className="mt-1 text-xs text-muted-foreground">Atualização automática ativa</div>
          </div>
          <button
            onClick={handleSync}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("open")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "open"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Contratos Ativos
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {activeTrades.length}
          </span>
        </button>

        <button
          onClick={() => setTab("closed")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "closed"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Histórico Encerrado
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {closedTrades.length}
          </span>
        </button>
      </div>

      {/* Trades Table */}
      {tab === "open" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {activeTrades.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum contrato ativo no momento. O robô monitora continuamente oportunidades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Contrato ID</th>
                    <th className="p-3">Ativo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Investido</th>
                    <th className="p-3">P/L Atual</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeTrades.map((t) => {
                    const plUsd = t.pnl;
                    const isWin = plUsd >= 0;

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors hover:bg-muted/30 ${
                          isWin ? "bg-emerald-500/5" : "bg-rose-500/5"
                        }`}
                      >
                        <td className="p-3 font-mono text-xs">{t.contractId || t.id}</td>
                        <td className="p-3 font-semibold">{t.symbol}</td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                              t.contractType.toUpperCase().includes("RISE") ||
                              t.contractType.toUpperCase().includes("CALL")
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {t.contractType}
                          </span>
                        </td>
                        <td className="p-3">${t.buyPrice.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${isWin ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {fmtUsd(plUsd)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleClosePosition(t)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Vender Agora
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "closed" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {closedTrades.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum trade encerrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Contrato ID</th>
                    <th className="p-3">Ativo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Compra</th>
                    <th className="p-3">Venda</th>
                    <th className="p-3">P/L Realizado</th>
                    <th className="p-3">Motivo Encerramento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {closedTrades.map((t) => {
                    const plUsd = t.pnl;
                    const isWin = t.status === "won" || plUsd >= 0;

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors hover:bg-muted/30 ${
                          isWin ? "bg-emerald-500/5" : "bg-rose-500/5"
                        }`}
                      >
                        <td className="p-3 text-xs text-muted-foreground">
                          {t.openedAt ? new Date(t.openedAt).toLocaleString("pt-BR") : "-"}
                        </td>
                        <td className="p-3 font-mono text-xs">{t.contractId || t.id}</td>
                        <td className="p-3 font-semibold">{t.symbol}</td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                              t.contractType.toUpperCase().includes("RISE") ||
                              t.contractType.toUpperCase().includes("CALL")
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {t.contractType}
                          </span>
                        </td>
                        <td className="p-3">${t.buyPrice.toFixed(2)}</td>
                        <td className="p-3">{t.sellPrice ? `$${t.sellPrice.toFixed(2)}` : "-"}</td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${isWin ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {fmtUsd(plUsd)}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {t.reason || t.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
