"use client";

import { useState, useEffect } from "react";
import { Plus, Play, Pause, Trash2, XCircle, Brain, Pencil, BarChart3, Clock, Search } from "lucide-react";
import {
  alternarEstrategiaIcMarkets,
  deletarEstrategiaIcMarkets,
  fecharPosicaoIcMarkets,
  buscarTradesIcMarkets,
  buscarEstrategiasIcMarkets,
  buscarSaldoIcMarkets,
  type IcMarketsPeriod,
} from "@/features/icmarkets/icmarkets.actions";
import { IcMarketsAiStrategyView } from "@/features/icmarkets/components/icmarkets-ai-strategy-view";
import { IcMarketsStatsHeader } from "@/features/icmarkets/components/icmarkets-stats-header";
import { IcMarketsStrategyModal } from "@/features/icmarkets/components/icmarkets-strategy-modal";
import { UniversalTimelineChart } from "@/components/charts/universal-timeline-chart";
import type {
  IcMarketsStrategy,
  IcMarketsTrade,
  IcMarketsAiMetadata,
  IcMarketsBalance,
  IcMarketsSettings,
} from "@/features/icmarkets/icmarkets.schema";

type IcMarketsBoardProps = {
  strategies: readonly IcMarketsStrategy[];
  trades: readonly IcMarketsTrade[];
  initialOpenTrades?: readonly IcMarketsTrade[];
  aiMetadata: IcMarketsAiMetadata | null;
  initialBalance?: IcMarketsBalance | null;
  initialSettings?: IcMarketsSettings | null;
};

export function IcMarketsBoard({
  strategies,
  trades: initialTrades,
  initialOpenTrades = [],
  aiMetadata,
  initialBalance = null,
  initialSettings = null,
}: IcMarketsBoardProps): React.ReactNode {
  const [aba, setAba] = useState<"open" | "monitored" | "closed" | "performance" | "aiStrategy">(
    "open",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<IcMarketsStrategy | null>(null);

  const [periodo, setPeriodo] = useState<IcMarketsPeriod>("today");
  const [tradesList, setTradesList] = useState<readonly IcMarketsTrade[]>(initialTrades);
  const [strategyList, setStrategyList] = useState<readonly IcMarketsStrategy[]>(strategies);
  const [openTradesList, setOpenTradesList] = useState<readonly IcMarketsTrade[]>(
    initialOpenTrades.length > 0 ? initialOpenTrades : initialTrades.filter((t) => t.status === "open")
  );
  const [balance, setBalance] = useState<IcMarketsBalance | null>(initialBalance);

  // Sincroniza estado quando o servidor ou revalidação trouxer novas props
  const [prevStrategies, setPrevStrategies] = useState(strategies);
  if (strategies !== prevStrategies) {
    setPrevStrategies(strategies);
    setStrategyList(strategies);
  }

  const [prevOpenTrades, setPrevOpenTrades] = useState(initialOpenTrades);
  if (initialOpenTrades !== prevOpenTrades) {
    setPrevOpenTrades(initialOpenTrades);
    setOpenTradesList(initialOpenTrades);
  }

  const [prevInitialTrades, setPrevInitialTrades] = useState(initialTrades);
  if (initialTrades !== prevInitialTrades) {
    setPrevInitialTrades(initialTrades);
    setTradesList(initialTrades);
  }

  const [prevBalance, setPrevBalance] = useState(initialBalance);
  if (initialBalance !== prevBalance) {
    setPrevBalance(initialBalance);
    setBalance(initialBalance);
  }

  // Estado da aba Lucro/Prejuízo por Ativo
  const [perfPeriod, setPerfPeriod] = useState<string>("today");
  const [perfTrades, setPerfTrades] = useState<readonly IcMarketsTrade[]>([]);
  const [loadingPerf, setLoadingPerf] = useState<boolean>(false);
  const [perfConsulted, setPerfConsulted] = useState<boolean>(false);

  const consultarPerformance = async (p: string): Promise<void> => {
    setLoadingPerf(true);
    setPerfConsulted(true);
    const res = await buscarTradesIcMarkets({
      periodo: p === "all" ? undefined : (p as IcMarketsPeriod),
      status: "closed",
    });
    if (res.ok) {
      setPerfTrades(res.trades);
    }
    setLoadingPerf(false);
  };

  const recarregarDados = async (): Promise<void> => {
    const [stratRes, openRes, closedRes, balRes] = await Promise.all([
      buscarEstrategiasIcMarkets(),
      buscarTradesIcMarkets({ status: "open" }),
      buscarTradesIcMarkets({ periodo, status: "closed" }),
      buscarSaldoIcMarkets(),
    ]);
    if (stratRes.ok) {
      setStrategyList(stratRes.strategies);
    }
    if (openRes.ok) {
      setOpenTradesList(openRes.trades);
    }
    if (closedRes.ok) {
      setTradesList(closedRes.trades);
    }
    if (balRes.ok) {
      setBalance(balRes.balance);
    }
  };

  useEffect(() => {
    const timer = setInterval(recarregarDados, 5000);
    return () => clearInterval(timer);
  }, [periodo]);

  const carregarTrades = async (p: IcMarketsPeriod): Promise<void> => {
    setPeriodo(p);
    const [tradesRes, balRes] = await Promise.all([
      buscarTradesIcMarkets({ periodo: p, status: "closed" }),
      buscarSaldoIcMarkets(),
    ]);
    if (tradesRes.ok) {
      setTradesList(tradesRes.trades);
    }
    if (balRes.ok) {
      setBalance(balRes.balance);
    }
  };

  const openPositions = openTradesList.filter((t) => t.status === "open");
  const openPosIdSet = new Set(openPositions.map((p) => String(p.positionId || p.id)));
  const closedTrades = tradesList.filter(
    (t) => t.status === "closed" && !openPosIdSet.has(String(t.positionId || t.id))
  );
  const monitoredStrategies = strategyList;

  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.pnlUsd || 0) > 0).length;
  const totalPnlUsd = closedTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const openPositionsCount = openPositions.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho Estatístico Reativo */}
      <IcMarketsStatsHeader
        balanceUsd={balance?.balance ?? 0}
        currency={balance?.currency ?? "USD"}
        accountType={balance?.accountType ?? initialSettings?.accountType ?? "demo"}
        accountId={balance?.accountId ?? initialSettings?.accountId ?? "10117517"}
        leverage={balance?.leverage}
        totalPnlUsd={totalPnlUsd}
        openPositionsCount={openPositionsCount}
        totalTrades={totalTrades}
        winningTrades={winningTrades}
      />
      {/* Abas Superiores */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAba("open")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              aba === "open"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Posições Abertas ({openPositions.length})
          </button>
          <button
            type="button"
            onClick={() => setAba("monitored")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              aba === "monitored"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Estratégias Monitoradas ({monitoredStrategies.length})
          </button>
          <button
            type="button"
            onClick={() => setAba("closed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              aba === "closed"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Histórico de Operações
          </button>
          <button
            type="button"
            onClick={() => {
              setAba("performance");
              if (!perfConsulted) void consultarPerformance(perfPeriod);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              aba === "performance"
                ? "bg-cyan-600 text-white"
                : "bg-slate-900 text-cyan-400 hover:text-white"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Lucro/Prejuízo por Ativo
          </button>
          <button
            type="button"
            onClick={() => setAba("aiStrategy")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              aba === "aiStrategy"
                ? "bg-purple-600 text-white"
                : "bg-slate-900 text-purple-400 hover:text-white"
            }`}
          >
            <Brain className="h-3.5 w-3.5" /> IA Meta-Labeler (Gate 4)
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingStrategy(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" /> Nova Estratégia
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {aba === "open" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          {openPositions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhuma posição aberta no momento na IC Markets. O robô está monitorando o mercado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">ID Ordem</th>
                    <th className="py-2.5 px-3">Par</th>
                    <th className="py-2.5 px-3">Lado</th>
                    <th className="py-2.5 px-3">Lote</th>
                    <th className="py-2.5 px-3">Preço Entrada</th>
                    <th className="py-2.5 px-3">PnL USD</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {openPositions.map((pos) => {
                    const pnl = pos.pnlUsd || 0;
                    const pnlColor =
                      pnl >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold";
                    return (
                      <tr key={pos.id || pos.positionId} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono text-slate-400">#{pos.positionId}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{pos.symbol}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={
                              pos.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{pos.lotSize}</td>
                        <td className="py-2.5 px-3 font-mono">{pos.entryPrice.toFixed(5)}</td>
                        <td className={`py-2.5 px-3 font-mono ${pnlColor}`}>
                          {pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await fecharPosicaoIcMarkets(pos.strategyId || "", pos.positionId);
                              recarregarDados();
                            }}
                            className="inline-flex items-center gap-1 rounded bg-rose-600/20 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-600 hover:text-white"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Fechar
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

      {aba === "monitored" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          {monitoredStrategies.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhuma estratégia cadastrada. Clique em "Nova Estratégia" acima.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {monitoredStrategies.map((strat) => (
                <div
                  key={strat.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{strat.name}</h4>
                      <span className="font-mono text-xs text-indigo-400">{strat.symbol}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => alternarEstrategiaIcMarkets(strat.id)}
                      className={`rounded p-1 text-xs ${
                        strat.active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {strat.active ? (
                        <Play className="h-3.5 w-3.5" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      Lote: <b className="text-white">{strat.lotSize}</b>
                    </div>
                    <div>
                      Spread Máx: <b className="text-white">{strat.maxSpreadPips} pips</b>
                    </div>
                    <div>
                      TP / SL: <b className="text-emerald-400">+{strat.takeProfitPips}</b> / <b className="text-rose-400">-{strat.stopLossPips}</b>
                    </div>
                    <div>
                      Gates: <b className="text-purple-400">ER≥{strat.minEfficiencyRatio} VR≥{strat.minVarianceRatio}</b>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span className="text-[10px] text-slate-500">{strat.totalTrades} trades</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStrategy(strat);
                          setModalOpen(true);
                        }}
                        title="Editar estratégia"
                        className="text-slate-500 hover:text-indigo-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletarEstrategiaIcMarkets(strat.id)}
                        title="Excluir estratégia"
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aba === "closed" && (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex gap-2">
            {(["1h", "today", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => carregarTrades(p)}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  periodo === p
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                {p === "1h" ? "1 Hora" : p === "today" ? "Hoje" : p === "7d" ? "7 Dias" : "30 Dias"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Par</th>
                  <th className="py-2 px-3">Lado</th>
                  <th className="py-2 px-3">Lote</th>
                  <th className="py-2 px-3">Preço Entrada</th>
                  <th className="py-2 px-3">Preço Saída</th>
                  <th className="py-2 px-3">Pips</th>
                  <th className="py-2 px-3">PnL USD</th>
                  <th className="py-2 px-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {closedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-500 font-sans">
                      Nenhuma operação encerrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  closedTrades.map((trade) => {
                    const pnl = trade.pnlUsd || 0;
                    const isWin = pnl > 0;
                    return (
                      <tr key={trade.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-400">
                          {trade.openedAt
                            ? new Date(trade.openedAt).toLocaleTimeString("pt-BR")
                            : "-"}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">{trade.symbol}</td>
                        <td
                          className={`py-2 px-3 font-bold ${trade.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {trade.side}
                        </td>
                        <td className="py-2 px-3">{trade.lotSize}</td>
                        <td className="py-2 px-3">{trade.entryPrice.toFixed(5)}</td>
                        <td className="py-2 px-3">
                          {trade.exitPrice ? trade.exitPrice.toFixed(5) : "-"}
                        </td>
                        <td
                          className={`py-2 px-3 ${trade.pips >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {trade.pips >= 0 ? `+${trade.pips}` : trade.pips}
                        </td>
                        <td
                          className={`py-2 px-3 font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {isWin ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px] text-slate-400">
                          {trade.closeReason || "normal"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba: Lucro/Prejuízo por Ativo */}
      {aba === "performance" && (
        <div className="space-y-4">
          {/* Barra de Seleção de Intervalo e Botão de Consulta Sob Demanda */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Clock className="h-4 w-4 text-cyan-400" />
                Intervalo:
              </span>
              {(
                [
                  { id: "1h", label: "1 Hora" },
                  { id: "24h", label: "24 Horas" },
                  { id: "today", label: "Hoje" },
                  { id: "7d", label: "7 Dias" },
                  { id: "30d", label: "30 Dias" },
                  { id: "all", label: "Tudo" },
                ] as const
              ).map((p) => {
                const isSelected = perfPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPerfPeriod(p.id);
                      void consultarPerformance(p.id);
                    }}
                    disabled={loadingPerf}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => consultarPerformance(perfPeriod)}
              disabled={loadingPerf}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/30 transition-all hover:bg-cyan-500 disabled:opacity-50"
            >
              <Search className={`h-3.5 w-3.5 ${loadingPerf ? "animate-spin" : ""}`} />
              {loadingPerf ? "Consultando..." : "Consultar Agora"}
            </button>
          </div>

          {/* Conteúdo Agregado por Ativo */}
          {loadingPerf ? (
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-12 text-center text-sm font-semibold text-cyan-400">
              Carregando dados consolidados de desempenho...
            </div>
          ) : !perfConsulted ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/70 p-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-cyan-400 opacity-60" />
              <h3 className="mt-3 text-base font-bold text-white">Consulta sob Demanda</h3>
              <p className="mt-1 text-xs text-slate-400">
                Selecione o intervalo de tempo acima e clique em Consultar para analisar os lucros e prejuízos por ativo.
              </p>
            </div>
          ) : (
            (() => {
              const closedPerfTrades = perfTrades.filter(
                (t) => t.status !== "open"
              );

              if (closedPerfTrades.length === 0) {
                return (
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-12 text-center text-sm text-slate-400">
                    Nenhuma operação encerrada encontrada no período selecionado ({perfPeriod}).
                  </div>
                );
              }

              const symbolMap = new Map<
                string,
                {
                  symbol: string;
                  totalTrades: number;
                  wins: number;
                  losses: number;
                  lotSize: number;
                  pnl: number;
                }
              >();

              closedPerfTrades.forEach((t) => {
                const sym = t.symbol || "OUTROS";
                const pnl = t.pnlUsd || 0;
                const isWin = pnl > 0;
                const isLoss = pnl < 0;

                const entry = symbolMap.get(sym);
                if (entry) {
                  entry.totalTrades += 1;
                  if (isWin) entry.wins += 1;
                  else if (isLoss) entry.losses += 1;
                  entry.lotSize += t.lotSize || 0.01;
                  entry.pnl += pnl;
                } else {
                  symbolMap.set(sym, {
                    symbol: sym,
                    totalTrades: 1,
                    wins: isWin ? 1 : 0,
                    losses: isLoss ? 1 : 0,
                    lotSize: t.lotSize || 0.01,
                    pnl,
                  });
                }
              });

              const groupedList = Array.from(symbolMap.values()).sort((a, b) => b.pnl - a.pnl);
              const totalPeriodPnl = groupedList.reduce((acc, i) => acc + i.pnl, 0);
              const totalPeriodTrades = groupedList.reduce((acc, i) => acc + i.totalTrades, 0);
              const totalPeriodWins = groupedList.reduce((acc, i) => acc + i.wins, 0);
              const totalPeriodLosses = groupedList.reduce((acc, i) => acc + i.losses, 0);
              const totalPeriodWinRate =
                totalPeriodTrades > 0 ? (totalPeriodWins / totalPeriodTrades) * 100 : 0;

              return (
                <div className="space-y-4">
                  {/* Resumo do Período (Totalizadores) */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        P/L do Período
                      </span>
                      <div
                        className={`mt-1 font-mono text-xl font-black ${
                          totalPeriodPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {totalPeriodPnl >= 0
                          ? `+$${totalPeriodPnl.toFixed(2)}`
                          : `-$${Math.abs(totalPeriodPnl).toFixed(2)}`}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Total de Trades
                      </span>
                      <div className="mt-1 font-mono text-xl font-black text-white">
                        {totalPeriodTrades}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Ganhos / Perdas
                      </span>
                      <div className="mt-1 flex items-baseline gap-2 font-mono text-base font-bold">
                        <span className="text-emerald-400">{totalPeriodWins}W</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-rose-400">{totalPeriodLosses}L</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Taxa de Acerto
                      </span>
                      <div className="mt-1 font-mono text-xl font-black text-cyan-400">
                        {totalPeriodWinRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Linha do Tempo de P/L por Ativo */}
                  <UniversalTimelineChart
                    title="Curva de Ganho e Perda na Linha do Tempo IC Markets (P/L Acumulado por Par)"
                    subtitle="Evolução cumulativa de resultados por par cTrader Forex/CFD operado no período selecionado."
                    badgeColor="bg-indigo-400"
                    trades={closedPerfTrades.map((t) => ({
                      id: t.id,
                      symbol: t.symbol,
                      pnl: t.pnlUsd || 0,
                      status: t.status,
                      timestamp: new Date(t.closedAt || t.openedAt || t.createdAt || 0).getTime(),
                    }))}
                  />

                  {/* Tabela por Ativo */}
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/10 bg-slate-900/50 text-xs font-semibold uppercase text-slate-400">
                          <tr>
                            <th className="p-3">Ativo (Symbol)</th>
                            <th className="p-3 text-center">Trades</th>
                            <th className="p-3 text-center">Ganhos (Wins)</th>
                            <th className="p-3 text-center">Perdas (Losses)</th>
                            <th className="p-3 text-center">Taxa de Acerto</th>
                            <th className="p-3 text-right">Lotes Negociados</th>
                            <th className="p-3 text-right">P/L Líquido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {groupedList.map((item) => {
                            const winRateItem =
                              item.totalTrades > 0 ? (item.wins / item.totalTrades) * 100 : 0;
                            const isPositive = item.pnl >= 0;

                            return (
                              <tr
                                key={item.symbol}
                                className={`transition-colors hover:bg-slate-800/30 ${
                                  isPositive ? "bg-emerald-500/5" : "bg-rose-500/5"
                                }`}
                              >
                                <td className="p-3 font-mono text-xs font-bold text-cyan-400">
                                  {item.symbol}
                                </td>
                                <td className="p-3 text-center font-bold text-white">
                                  {item.totalTrades}
                                </td>
                                <td className="p-3 text-center font-semibold text-emerald-400">
                                  {item.wins}
                                </td>
                                <td className="p-3 text-center font-semibold text-rose-400">
                                  {item.losses}
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                                      winRateItem >= 70
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : winRateItem >= 50
                                          ? "bg-amber-500/20 text-amber-400"
                                          : "bg-rose-500/20 text-rose-400"
                                    }`}
                                  >
                                    {winRateItem.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono text-slate-300">
                                  {item.lotSize.toFixed(2)} lotes
                                </td>
                                <td
                                  className={`p-3 text-right font-mono font-black ${
                                    isPositive ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {item.pnl >= 0
                                    ? `+$${item.pnl.toFixed(2)}`
                                    : `-$${Math.abs(item.pnl).toFixed(2)}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {aba === "aiStrategy" && <IcMarketsAiStrategyView metadata={aiMetadata} />}

      {modalOpen && (
        <IcMarketsStrategyModal strategy={editingStrategy} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
