"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Brain,
  Plus,
  Play,
  Pause,
  Trash2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  XCircle,
  BarChart3,
  Clock,
  Search,
} from "lucide-react";
import { FxProAiStrategyView } from "@/features/fxpro/components/fxpro-ai-strategy-view";
import { FxProStrategyForm } from "@/features/fxpro/components/fxpro-strategy-form";
import { FxProStrategyModal } from "@/features/fxpro/components/fxpro-strategy-modal";
import {
  alternarEstrategiaFxPro,
  buscarTradesFxPro,
  deletarEstrategiaFxPro,
  fecharPosicaoFxPro,
  type FxProPeriod,
} from "@/features/fxpro/fxpro.actions";
import type { FxProStrategy, FxProTrade } from "@/features/fxpro/fxpro.schema";

type FxProBoardProps = {
  strategies: readonly FxProStrategy[];
  trades: readonly FxProTrade[];
  exchangeKeys?: readonly { id: string; exchangeId: string; nome: string }[];
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

const EMPTY_EXCHANGE_KEYS: readonly { id: string; exchangeId: string; nome: string }[] = [];

export function FxProBoard({
  strategies,
  trades: initialTrades,
  exchangeKeys = EMPTY_EXCHANGE_KEYS,
}: FxProBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aba, setAba] = useState<"open" | "monitored" | "closed" | "performance" | "aiStrategy">(
    "open",
  );
  const [criando, setCriando] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<FxProStrategy | null>(null);
  const [periodo, setPeriodo] = useState<FxProPeriod>("today");
  const [tradesList, setTradesList] = useState<readonly FxProTrade[]>(initialTrades);
  const [carregandoTrades, setCarregandoTrades] = useState(false);

  // Performance por Ativo (Consulta sob demanda)
  const [perfPeriod, setPerfPeriod] = useState<FxProPeriod>("1h");
  const [perfTrades, setPerfTrades] = useState<readonly FxProTrade[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [perfConsulted, setPerfConsulted] = useState(false);

  const consultarPerformance = async (p: FxProPeriod = perfPeriod): Promise<void> => {
    setPerfPeriod(p);
    setLoadingPerf(true);
    const res = await buscarTradesFxPro({ periodo: p });
    if (res.ok) {
      setPerfTrades(res.trades);
      setPerfConsulted(true);
    }
    setLoadingPerf(false);
  };

  const [previousInitialTrades, setPreviousInitialTrades] = useState(initialTrades);
  if (initialTrades !== previousInitialTrades) {
    setPreviousInitialTrades(initialTrades);
    setTradesList(initialTrades);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const carregarPeriodo = async (p: FxProPeriod): Promise<void> => {
    setPeriodo(p);
    setCarregandoTrades(true);
    const res = await buscarTradesFxPro({ periodo: p });
    setCarregandoTrades(false);
    if (res.ok) {
      setTradesList(res.trades);
    }
  };

  const [strategyList, setStrategyList] = useState<readonly FxProStrategy[]>(strategies);
  const [previousStrategies, setPreviousStrategies] = useState(strategies);
  if (strategies !== previousStrategies) {
    setPreviousStrategies(strategies);
    setStrategyList(strategies);
  }

  const encerradas = tradesList.filter((t) => t.status === "closed");
  const posicoesAbertas = (() => {
    const fromTrades = tradesList.filter((t) => t.status === "open");
    if (fromTrades.length > 0) return fromTrades;
    return strategyList
      .filter((s) => s.currentPositionId)
      .map((s) => ({
        id: s.currentPositionId || s.id,
        strategyId: s.id || s._id || "",
        positionId: s.currentPositionId || "",
        symbol: s.symbol,
        side: s.currentSide || "BUY",
        lotSize: s.lotSize,
        entryPrice: s.entryPrice,
        stopLossPrice: null,
        takeProfitPrice: null,
        pnlUsd: s.currentPnlUsd,
        pips: 0,
        status: "open" as const,
        openedAt: s.lastTradeAt || s.createdAt,
      }));
  })();

  const confirmarToggle = (strat: FxProStrategy): void => {
    const stratId = strat.id || strat._id || "";
    setStrategyList((prev) =>
      prev.map((s) => ((s.id || s._id) === stratId ? { ...s, active: !s.active } : s)),
    );
    startTransition(async () => {
      await alternarEstrategiaFxPro(stratId);
      router.refresh();
    });
  };

  const confirmarFecharPosicao = (positionId: string, symbol: string): void => {
    if (!confirm(`Encerrar a mercado a posição #${positionId} (${symbol}) na cTrader?`)) return;
    startTransition(async () => {
      await fecharPosicaoFxPro(positionId, symbol);
      router.refresh();
    });
  };

  const confirmarExcluir = (strat: FxProStrategy): void => {
    const stratId = strat.id || strat._id || "";
    if (!confirm(`Excluir permanentemente a estratégia "${strat.name}"?`)) return;
    setStrategyList((prev) => prev.filter((s) => (s.id || s._id) !== stratId));
    startTransition(async () => {
      await deletarEstrategiaFxPro(stratId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Botão de Criação */}
      {criando ? (
        <FxProStrategyForm exchangeKeys={exchangeKeys} onFechar={() => setCriando(false)} />
      ) : (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Criar Estratégia FxPro
          </button>
        </div>
      )}

      {/* Abas */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {(
          [
            { key: "open", label: "Posições Abertas", count: posicoesAbertas.length },
            { key: "monitored", label: "Pares Monitorados", count: strategyList.length },
            { key: "closed", label: "Histórico de Trades", count: encerradas.length },
            { key: "performance", label: "Lucro/Prejuízo por Ativo", count: null, icon: BarChart3 },
            { key: "aiStrategy", label: "IA Meta-Labeling (Gate 4)", count: null, icon: Brain },
          ] as const
        ).map((tab) => {
          const Icon = "icon" in tab ? tab.icon : null;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setAba(tab.key);
                if (tab.key === "performance" && !perfConsulted) {
                  void consultarPerformance(perfPeriod);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                aba === tab.key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {Icon ? <Icon className="h-3.5 w-3.5 text-indigo-400" /> : null}
              {tab.label}
              {tab.count !== null ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    aba === tab.key ? "bg-white/20" : "bg-slate-800"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Aba: Posições Abertas */}
      {aba === "open" && (
        <div className="grid gap-4 md:grid-cols-2">
          {posicoesAbertas.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma posição aberta na FxPro cTrader no momento.
            </div>
          ) : (
            posicoesAbertas.map((trade, idx) => {
              const strat = strategyList.find(
                (s) => (s.id && s.id === trade.strategyId) || s.symbol === trade.symbol,
              );
              return (
                <div
                  key={
                    trade.id
                      ? `${trade.id}-${idx}`
                      : `${trade.positionId || "pos"}-${trade.symbol}-${idx}`
                  }
                  className="rounded-xl border border-indigo-500/30 bg-slate-950/70 p-5 shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{trade.symbol}</h3>
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                          {strat?.name || "Estratégia FxPro"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-indigo-400 font-mono font-bold">
                        {strat
                          ? `${strat.timeframe} • Alavancagem 1:${strat.leverage}`
                          : "FxPro cTrader"}
                      </div>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const currentPnl =
                          strat && strat.currentPnlUsd !== 0 ? strat.currentPnlUsd : trade.pnlUsd;
                        return (
                          <div
                            className={`font-mono text-base font-black ${
                              currentPnl > 0
                                ? "text-emerald-400"
                                : currentPnl < 0
                                  ? "text-rose-400"
                                  : "text-slate-300"
                            }`}
                          >
                            {fmtUsd(currentPnl)}
                          </div>
                        );
                      })()}
                      <div className="text-[11px] text-slate-500">Posição #{trade.positionId}</div>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-slate-900/60 p-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Lado</span>
                      <div className="flex items-center gap-1 font-bold text-white">
                        {trade.side.toUpperCase() === "BUY" ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                        )}
                        {trade.side} ({trade.lotSize} lotes)
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Preço Entrada
                      </span>
                      <div className="font-mono font-bold text-white">
                        {trade.entryPrice ? trade.entryPrice.toFixed(5) : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        TP / SL
                      </span>
                      <div className="font-mono text-[11px] text-slate-300">
                        {strat ? `+${strat.takeProfitPips}p / -${strat.stopLossPips}p` : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-400">
                    <span>
                      Aberta em:{" "}
                      {trade.openedAt ? new Date(trade.openedAt).toLocaleTimeString() : "Agora"}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        confirmarFecharPosicao(trade.positionId || trade.id, trade.symbol)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Encerrar Posição
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Aba: Pares Monitorados (Todas as Estratégias) */}
      {aba === "monitored" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {strategyList.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma estratégia FxPro cadastrada.
            </div>
          ) : (
            strategyList.map((strat, idx) => (
              <div
                key={
                  strat.id
                    ? `${strat.id}-${strat.symbol}-${idx}`
                    : `monitored-${strat.symbol}-${idx}`
                }
                className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate text-sm font-bold text-white">{strat.name}</span>
                    {strat.currentPositionId ? (
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-black text-indigo-300 border border-indigo-500/40 animate-pulse">
                        EM OPERAÇÃO
                      </span>
                    ) : strat.active ? (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                        MONITORANDO
                      </span>
                    ) : (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                        PAUSADO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingStrategy(strat)}
                      className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
                      title="Configurar Parâmetros do Ativo"
                    >
                      <Settings className="h-3.5 w-3.5 text-indigo-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmarToggle(strat)}
                      className={`p-1 rounded ${
                        strat.active
                          ? "text-emerald-400 hover:bg-emerald-950"
                          : "text-slate-500 hover:bg-slate-800"
                      }`}
                      title={strat.active ? "Pausar" : "Ativar"}
                    >
                      {strat.active ? (
                        <Play className="h-3.5 w-3.5" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmarExcluir(strat)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-indigo-400">{strat.symbol}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {strat.timeframe}
                  </span>
                  <span className="text-slate-500">| {strat.lotSize} lotes</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[11px]">
                  <span className="text-slate-400">
                    Random Walk: <b className="text-white">&ge;{strat.minVarianceRatio}</b>
                  </span>
                  <span className="text-slate-400">
                    Kaufman ER: <b className="text-white">&ge;{strat.minEfficiencyRatio}</b>
                  </span>
                  <span className="text-slate-400">
                    Max Spread: <b className="text-white">{strat.maxSpreadPips}p</b>
                  </span>
                  <span className="text-slate-400">
                    Trades:{" "}
                    <b className="text-white">
                      {strat.totalTrades} ({strat.winningTrades}W)
                    </b>
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                  <span className="text-slate-400">Lucro Total:</span>
                  <span
                    className={`font-mono font-bold ${
                      strat.totalProfitUsd >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {fmtUsd(strat.totalProfitUsd)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Aba: Histórico de Trades */}
      {aba === "closed" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/80 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Período do Histórico:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "today", label: "Hoje" },
                  { id: "7d", label: "Últimos 7 dias" },
                  { id: "30d", label: "Últimos 30 dias" },
                  { id: "all", label: "Histórico Completo" },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  disabled={carregandoTrades}
                  onClick={() => carregarPeriodo(btn.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    periodo === btn.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {carregandoTrades ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-xs text-slate-400">
              Carregando histórico FxPro...
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {encerradas.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
                  Nenhum trade encerrado encontrado no período.
                </div>
              ) : (
                encerradas.map((t, idx) => (
                  <div
                    key={t.id ? `${t.id}-${idx}` : `${t.positionId || "trade"}-${t.symbol}-${idx}`}
                    className={`rounded-xl border p-4 transition-colors ${
                      t.pnlUsd > 0
                        ? "border-emerald-500/20 bg-emerald-950/30"
                        : "border-rose-500/20 bg-rose-950/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                        <span>{t.symbol}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            t.side === "BUY"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {t.side}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-base font-black ${
                          t.pnlUsd >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {fmtUsd(t.pnlUsd)}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/5 pt-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Entrada</span>
                        <div className="font-mono text-slate-300">{t.entryPrice.toFixed(5)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Saída</span>
                        <div className="font-mono text-slate-300">
                          {t.exitPrice?.toFixed(5) || "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Lote</span>
                        <div className="font-mono text-slate-300">{t.lotSize}</div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-1.5">
                      <span>Motivo: {t.closeReason?.toUpperCase() || "MKT"}</span>
                      <span>{t.closedAt ? new Date(t.closedAt).toLocaleTimeString() : ""}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
                  { id: "5m", label: "5 Min" },
                  { id: "10m", label: "10 Min" },
                  { id: "30m", label: "30 Min" },
                  { id: "1h", label: "1 Hora" },
                  { id: "2h", label: "2 Horas" },
                  { id: "3h", label: "3 Horas" },
                  { id: "5h", label: "5 Horas" },
                  { id: "12h", label: "12 Horas" },
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
                Selecione o intervalo de tempo acima e clique em Consultar para analisar os lucros e
                prejuízos por ativo Forex/CFD.
              </p>
              <button
                onClick={() => consultarPerformance(perfPeriod)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                <Search className="h-4 w-4" />
                Consultar Período ({perfPeriod})
              </button>
            </div>
          ) : (
            (() => {
              const closedPerfTrades = perfTrades.filter(
                (t) => t.status !== "open" && t.status !== "pending",
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
                const isWin = pnl > 0 || (t.closeReason && t.closeReason.includes("tp"));
                const isLoss = pnl < 0 || (t.closeReason && t.closeReason.includes("sl"));

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

              const groupedList = Array.from(symbolMap.values()).toSorted((a, b) => b.pnl - a.pnl);
              const totalPeriodPnl = groupedList.reduce((acc, i) => acc + i.pnl, 0);
              const totalPeriodTrades = groupedList.reduce((acc, i) => acc + i.totalTrades, 0);
              const totalPeriodWins = groupedList.reduce((acc, i) => acc + i.wins, 0);
              const totalPeriodLosses = groupedList.reduce((acc, i) => acc + i.losses, 0);
              const totalPeriodWinRate =
                totalPeriodTrades > 0 ? (totalPeriodWins / totalPeriodTrades) * 100 : 0;

              return (
                <div className="space-y-4">
                  {/* Resumo do Período */}
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
                        {fmtUsd(totalPeriodPnl)}
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
                                  {fmtUsd(item.pnl)}
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

      {/* Aba: IA Meta-Labeling (Gate 4) */}
      {aba === "aiStrategy" && <FxProAiStrategyView />}

      {/* Modal de Configuração por Ativo */}
      {editingStrategy !== null && (
        <FxProStrategyModal strategy={editingStrategy} onFechar={() => setEditingStrategy(null)} />
      )}
    </div>
  );
}
