"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  BarChart3,
  Calendar,
  CircleDot,
  Clock,
  Edit3,
  Filter,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  fecharPosicaoDeriv,
  syncTradesDeriv,
  buscarSaldoDeriv,
  limparHistoricoDeriv,
  toggleDerivStrategy,
  deletarDerivStrategy,
  buscarTradesDerivPorPeriodo,
  listarDerivStrategies,
  analisarDerivComIa,
  type DerivPeriod,
} from "@/features/deriv/deriv.actions";
import { DerivStrategyForm } from "@/features/deriv/components/deriv-strategy-form";
import type {
  DerivAiAnalysis,
  DerivBalance,
  DerivStrategy,
  DerivTrade,
  DerivTradesSummary,
} from "@/features/deriv/deriv.schema";

type DerivBoardProps = {
  summary: DerivTradesSummary | null;
  trades: readonly DerivTrade[];
  balance?: DerivBalance | null;
  strategies?: readonly DerivStrategy[];
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

const EMPTY_STRATEGIES: readonly DerivStrategy[] = [];

export function DerivBoard({
  summary: _summary,
  trades: initialTrades,
  balance: initialBalance,
  strategies: initialStrategies = EMPTY_STRATEGIES,
}: DerivBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"strategies" | "performance" | "open" | "closed">("strategies");
  const [liveBalance, setLiveBalance] = useState<DerivBalance | null>(initialBalance ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<DerivStrategy | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<DerivPeriod>("today");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [tradeList, setTradeList] = useState<readonly DerivTrade[]>(initialTrades);
  const [strategyList, setStrategyList] = useState<readonly DerivStrategy[]>(initialStrategies);
  const [loadingTrades, setLoadingTrades] = useState(false);

  // Performance por Ativo (Consulta sob demanda)
  const [perfPeriod, setPerfPeriod] = useState<DerivPeriod>("1h");
  const [perfTrades, setPerfTrades] = useState<readonly DerivTrade[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [perfConsulted, setPerfConsulted] = useState(false);

  // Análise retrospectiva por IA (Gemini/DeepSeek)
  const [aiAnalysis, setAiAnalysis] = useState<DerivAiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErro, setAiErro] = useState<string | null>(null);

  const consultarPerformance = async (periodo: DerivPeriod = perfPeriod): Promise<void> => {
    setPerfPeriod(periodo);
    setLoadingPerf(true);
    const res = await buscarTradesDerivPorPeriodo(periodo);
    if (res.ok) {
      setPerfTrades(res.data);
      setPerfConsulted(true);
    }
    setLoadingPerf(false);
  };

  const [previousStrategies, setPreviousStrategies] = useState(initialStrategies);
  if (initialStrategies !== previousStrategies) {
    setPreviousStrategies(initialStrategies);
    setStrategyList(initialStrategies);
  }

  const [previousTrades, setPreviousTrades] = useState(initialTrades);
  if (initialTrades !== previousTrades) {
    setPreviousTrades(initialTrades);
    setTradeList(initialTrades);
  }

  const [previousBalance, setPreviousBalance] = useState(initialBalance ?? null);
  if (initialBalance && initialBalance !== previousBalance) {
    setPreviousBalance(initialBalance);
    setLiveBalance(initialBalance);
  }

  const carregarTradesPorPeriodo = async (periodo: DerivPeriod): Promise<void> => {
    setSelectedPeriod(periodo);
    setLoadingTrades(true);
    const res = await buscarTradesDerivPorPeriodo(periodo);
    if (res.ok) {
      setTradeList(res.data);
    }
    setLoadingTrades(false);
  };

  useEffect(() => {
    let ativo = true;
    const fetchData = async (): Promise<void> => {
      const [resBalance, resTrades] = await Promise.all([
        buscarSaldoDeriv(),
        buscarTradesDerivPorPeriodo(selectedPeriod),
      ]);
      if (ativo) {
        if (resBalance.ok) {
          setLiveBalance(resBalance.data);
        }
        if (resTrades.ok) {
          setTradeList(resTrades.data);
        }
      }
    };

    void fetchData();
    const interval = setInterval(() => {
      void fetchData();
    }, 10000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [selectedPeriod]);

  const balance = liveBalance ?? initialBalance;

  const activeTrades = tradeList.filter((t) => t.status === "open" || t.status === "pending");
  const closedTrades = tradeList.filter((t) => t.status !== "open" && t.status !== "pending");

  // Lista de símbolos únicos presentes no histórico
  const availableSymbols = Array.from(
    new Set(closedTrades.map((t) => t.symbol).filter(Boolean)),
  ).toSorted();

  // Trades encerrados filtrados por ativo (se selecionado)
  const filteredClosedTrades =
    selectedSymbol === "ALL"
      ? closedTrades
      : closedTrades.filter((t) => t.symbol === selectedSymbol);

  const closedTradesPnl = filteredClosedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const closedTradesWins = filteredClosedTrades.filter((t) => t.pnl > 0).length;
  const closedTradesWinRate =
    filteredClosedTrades.length > 0 ? (closedTradesWins / filteredClosedTrades.length) * 100 : 0;

  const totalTrades = filteredClosedTrades.length;
  const totalPnl = closedTradesPnl;
  const winRate = closedTradesWinRate;

  const handleSync = (): void => {
    startTransition(async () => {
      await syncTradesDeriv();
      router.refresh();
    });
  };

  const handleClearHistory = (): void => {
    if (!confirm("Tem certeza que deseja zerar e limpar todo o histórico de operações Deriv?"))
      return;
    startTransition(async () => {
      await limparHistoricoDeriv();
      router.refresh();
    });
  };

  const handleAiAnalysis = (): void => {
    setAiLoading(true);
    setAiErro(null);
    startTransition(async () => {
      const res = await analisarDerivComIa();
      setAiLoading(false);
      if (res.ok) {
        setAiAnalysis(res.data);
      } else {
        setAiErro(res.erro);
      }
    });
  };

  const handleClosePosition = (trade: DerivTrade): void => {
    if (!confirm(`Encerrar antecipadamente o contrato ${trade.contractId}?`)) return;
    startTransition(async () => {
      await fecharPosicaoDeriv(trade.id);
      router.refresh();
    });
  };

  const handleToggleStrategy = (strategy: DerivStrategy): void => {
    setStrategyList((prev) =>
      prev.map((s) => (s.id === strategy.id ? { ...s, active: !s.active } : s)),
    );
    startTransition(async () => {
      await toggleDerivStrategy(strategy.id, !strategy.active);
      router.refresh();
    });
  };

  const handleDeleteStrategy = (strategy: DerivStrategy): void => {
    if (!confirm(`Excluir permanentemente a estratégia ${strategy.name}?`)) return;
    setStrategyList((prev) => prev.filter((s) => s.id !== strategy.id));
    startTransition(async () => {
      await deletarDerivStrategy(strategy.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Modal de Criação / Edição de Estratégia */}
      {isModalOpen && (
        <DerivStrategyForm
          strategyParaEditar={editingStrategy}
          onFechar={async () => {
            setIsModalOpen(false);
            setEditingStrategy(null);
            const res = await listarDerivStrategies();
            if (res.ok) {
              setStrategyList(res.data);
            }
            router.refresh();
          }}
        />
      )}

      {/* Cards de Saldo ao Vivo Deriv */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Conta Demo */}
        <div
          className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all ${
            balance?.activeAccount === "demo"
              ? "border-emerald-500/40 bg-emerald-950/20 ring-1 ring-emerald-500/30"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Wallet className="h-4 w-4" />
              Saldo Deriv - Conta Demo (Virtual)
            </span>
            {balance?.activeAccount === "demo" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <CircleDot className="h-2.5 w-2.5 fill-current animate-pulse" /> Ativo
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              $
              {(balance?.demo?.balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {balance?.demo?.currency ?? "USD"}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ID da Conta:{" "}
            <span className="font-mono font-medium text-slate-200">
              {balance?.demo?.loginId || "Não autenticado"}
            </span>
          </div>
        </div>

        {/* Conta Real */}
        <div
          className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all ${
            balance?.activeAccount === "real"
              ? "border-cyan-500/40 bg-cyan-950/20 ring-1 ring-cyan-500/30"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Wallet className="h-4 w-4" />
              Saldo Deriv - Conta Real (Produção)
            </span>
            {balance?.activeAccount === "real" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                <CircleDot className="h-2.5 w-2.5 fill-current animate-pulse" /> Ativo
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              $
              {(balance?.real?.balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {balance?.real?.currency ?? "USD"}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ID da Conta:{" "}
            <span className="font-mono font-medium text-slate-200">
              {balance?.real?.loginId || "Não autenticado"}
            </span>
          </div>
        </div>
      </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              Sincronizar
            </button>
            <button
              onClick={handleClearHistory}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              title="Limpar todo o histórico de operações"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar
            </button>
            <button
              onClick={handleAiAnalysis}
              disabled={aiLoading || isPending}
              className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
              title="Análise retrospectiva com IA"
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Analisando..." : "Análise IA"}
            </button>
          </div>
        </div>
      </div>

      {aiErro ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
          {aiErro}
        </div>
      ) : null}

      {aiAnalysis ? (
        <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">Análise Inteligente (IA)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-900/60 p-2">
              <span className="text-[10px] uppercase text-slate-500">Trades</span>
              <div className="text-sm font-bold text-white">{aiAnalysis.metrics.totalTrades}</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2">
              <span className="text-[10px] uppercase text-slate-500">Win Rate</span>
              <div className="text-sm font-bold text-emerald-400">
                {aiAnalysis.metrics.winRatePct}%
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2">
              <span className="text-[10px] uppercase text-slate-500">P/L</span>
              <div
                className={`text-sm font-bold ${
                  aiAnalysis.metrics.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {fmtUsd(aiAnalysis.metrics.totalPnl)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2">
              <span className="text-[10px] uppercase text-slate-500">Profit Factor</span>
              <div className="text-sm font-bold text-white">{aiAnalysis.metrics.profitFactor}</div>
            </div>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-200">
            {aiAnalysis.analysis}
          </pre>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          <button
            onClick={() => setTab("strategies")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "strategies"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Estratégias por Ativo
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-400">
              {strategyList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setTab("performance");
              if (!perfConsulted) {
                void consultarPerformance(perfPeriod);
              }
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "performance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Lucro/Prejuízo por Ativo
          </button>

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

        {tab === "strategies" && (
          <button
            onClick={() => {
              setEditingStrategy(null);
              setIsModalOpen(true);
            }}
            className="mb-2 flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-cyan-500"
          >
            <Plus className="h-4 w-4" />
            Nova Estratégia
          </button>
        )}
      </div>

      {/* Strategies Grid */}
      {tab === "strategies" && (
        <div className="space-y-4">
          {strategyList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-cyan-400 opacity-60" />
              <h3 className="mt-3 text-base font-bold text-white">Nenhuma Estratégia Cadastrada</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie regras específicas para cada ativo Deriv (ex: Volatility 10 1s, Volatility 100,
                BTC/USD).
              </p>
              <button
                onClick={() => {
                  setEditingStrategy(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Estratégia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {strategyList.map((strat) => (
                <div
                  key={strat.id}
                  className={`relative flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-all ${
                    strat.active
                      ? "border-cyan-500/30 bg-slate-900/60 shadow-cyan-950/20"
                      : "border-border bg-card/40 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block font-mono text-xs font-bold text-cyan-400">
                          {strat.symbol}
                        </span>
                        <h4 className="text-sm font-bold text-white">{strat.name}</h4>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          strat.active
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {strat.active ? "Ativa" : "Pausada"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-950/50 p-2">
                        <span className="text-[10px] text-muted-foreground">Tipo Contrato</span>
                        <p className="font-semibold text-slate-200">{strat.contractType}</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/50 p-2">
                        <span className="text-[10px] text-muted-foreground">Barreiras</span>
                        <p className="font-mono font-semibold text-slate-200">
                          H: {strat.barrier} | L: {strat.barrierLower}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-950/50 p-2">
                        <span className="text-[10px] text-muted-foreground">Aporte / Duração</span>
                        <p className="font-semibold text-slate-200">
                          ${strat.tradeSize.toFixed(2)} | {strat.durationSec}s
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-950/50 p-2">
                        <span className="text-[10px] text-muted-foreground">Certeza Mínima</span>
                        <p className="font-semibold text-slate-200">
                          {(strat.minCertaintyProb * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-950/50 p-2">
                        <span className="text-[10px] text-muted-foreground">TP / Stop Loss</span>
                        <p className="font-semibold text-slate-200">
                          <span className="text-emerald-400">+{strat.minTakeProfitPct ?? 15}%</span>
                          {" / "}
                          <span className="text-rose-400">-{strat.emergencyStopPct ?? 70}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Status Posição:</span>
                      <span
                        className={`font-semibold ${
                          strat.positionOpen ? "text-amber-400" : "text-slate-400"
                        }`}
                      >
                        {strat.positionOpen ? "Ordem Aberta" : "Aguardando Sinal"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      onClick={() => handleToggleStrategy(strat)}
                      disabled={isPending}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        strat.active
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {strat.active ? "Pausar" : "Ativar"}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingStrategy(strat);
                          setIsModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        title="Editar Estratégia"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStrategy(strat)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                        title="Excluir Estratégia"
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
                    <th className="p-3">Estratégia</th>
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
                        <td className="p-3 font-semibold text-white">
                          {t.strategyName || t.symbol}
                        </td>
                        <td className="p-3 font-mono text-xs text-cyan-400">{t.symbol}</td>
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

      {/* Tab: Lucro/Prejuízo por Ativo */}
      {tab === "performance" && (
        <div className="space-y-4">
          {/* Barra de Seleção de Período e Botão de Consulta Sob Demanda */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
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
              )

                .map((p) => {
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
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-white"
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
            <div className="rounded-xl border border-border bg-card p-12 text-center text-sm font-semibold text-cyan-400">
              Carregando dados consolidados de desempenho...
            </div>
          ) : !perfConsulted ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-cyan-400 opacity-60" />
              <h3 className="mt-3 text-base font-bold text-white">Consulta sob Demanda</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione o intervalo de tempo acima e clique em Consultar para analisar os lucros e
                prejuízos por ativo.
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
              // Agrupamento por Ativo (Symbol)
              const closedPerfTrades = perfTrades.filter(
                (t) => t.status !== "open" && t.status !== "pending",
              );

              if (closedPerfTrades.length === 0) {
                return (
                  <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
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
                  invested: number;
                  realized: number;
                  pnl: number;
                }
              >();

              closedPerfTrades.forEach((t) => {
                const sym = t.symbol || "Outros";
                const pnl = t.pnl || 0;
                const invested = t.investedUsd || t.buyPrice || 0;
                const realized = t.realizedUsd || t.sellPrice || 0;
                const isWin = pnl > 0 || (t.reason && t.reason.includes("Lucro"));
                const isLoss = pnl < 0 || (t.reason && t.reason.includes("Perda"));

                const entry = symbolMap.get(sym);
                if (entry) {
                  entry.totalTrades += 1;
                  if (isWin) entry.wins += 1;
                  else if (isLoss) entry.losses += 1;
                  entry.invested += invested;
                  entry.realized += realized;
                  entry.pnl += pnl;
                } else {
                  symbolMap.set(sym, {
                    symbol: sym,
                    totalTrades: 1,
                    wins: isWin ? 1 : 0,
                    losses: isLoss ? 1 : 0,
                    invested,
                    realized,
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
                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        P/L do Período
                      </span>
                      <div
                        className={`mt-1 text-xl font-black ${
                          totalPeriodPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {fmtUsd(totalPeriodPnl)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Total de Trades
                      </span>
                      <div className="mt-1 text-xl font-black text-white">{totalPeriodTrades}</div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Ganhos / Perdas
                      </span>
                      <div className="mt-1 flex items-baseline gap-2 text-base font-bold">
                        <span className="text-emerald-400">{totalPeriodWins}W</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-rose-400">{totalPeriodLosses}L</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Taxa de Acerto
                      </span>
                      <div className="mt-1 text-xl font-black text-cyan-400">
                        {totalPeriodWinRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Tabela por Ativo */}
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                          <tr>
                            <th className="p-3">Ativo (Symbol)</th>
                            <th className="p-3 text-center">Trades</th>
                            <th className="p-3 text-center">Ganhos (Wins)</th>
                            <th className="p-3 text-center">Perdas (Losses)</th>
                            <th className="p-3 text-center">Taxa de Acerto</th>
                            <th className="p-3 text-right">Volume Investido</th>
                            <th className="p-3 text-right">P/L Líquido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {groupedList.map((item) => {
                            const winRateItem =
                              item.totalTrades > 0 ? (item.wins / item.totalTrades) * 100 : 0;
                            const isPositive = item.pnl >= 0;

                            return (
                              <tr
                                key={item.symbol}
                                className={`transition-colors hover:bg-muted/30 ${
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
                                <td className="p-3 text-right text-slate-300">
                                  ${item.invested.toFixed(2)}
                                </td>
                                <td className="p-3 text-right">
                                  <span
                                    className={`text-base font-black ${
                                      isPositive ? "text-emerald-400" : "text-rose-400"
                                    }`}
                                  >
                                    {fmtUsd(item.pnl)}
                                  </span>
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

      {/* Tab: Histórico Encerrado */}
      {tab === "closed" && (
        <div className="space-y-3">
          {/* Barra de Filtro de Período e Ativo */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filtro de Período */}
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4 text-cyan-400" />
                Período:
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "5m", label: "5m" },
                    { id: "10m", label: "10m" },
                    { id: "30m", label: "30m" },
                    { id: "1h", label: "1h" },
                    { id: "2h", label: "2h" },
                    { id: "3h", label: "3h" },
                    { id: "5h", label: "5h" },
                    { id: "12h", label: "12h" },
                    { id: "24h", label: "24h" },
                    { id: "today", label: "Hoje" },
                    { id: "7d", label: "7 Dias" },
                    { id: "30d", label: "30 Dias" },
                    { id: "all", label: "Tudo" },
                  ] as const
                ).map((p) => {
                  const isSelected = selectedPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => carregarTradesPorPeriodo(p.id)}
                      disabled={loadingTrades}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Filtro de Ativo (Symbol) */}
              <div className="flex items-center gap-2 border-l border-border pl-4">
                <Filter className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-muted-foreground">Ativo:</span>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="rounded-lg border border-border bg-slate-900 px-2.5 py-1 text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ALL">Todos os Ativos ({closedTrades.length})</option>
                  {availableSymbols.map((sym) => {
                    const count = closedTrades.filter((t) => t.symbol === sym).length;
                    return (
                      <option key={sym} value={sym}>
                        {sym} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {selectedSymbol !== "ALL" && (
              <button
                onClick={() => setSelectedSymbol("ALL")}
                className="text-xs font-semibold text-slate-400 hover:text-white underline"
              >
                Limpar Filtro de Ativo
              </button>
            )}
          </div>

          {loadingTrades ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-cyan-400">
              Carregando histórico do período...
            </div>
          ) : filteredClosedTrades.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {`Nenhum trade encerrado encontrado para o filtro selecionado (${
                selectedSymbol !== "ALL" ? `Ativo: ${selectedSymbol} | ` : ""
              }${
                selectedPeriod === "today"
                  ? "Hoje"
                  : selectedPeriod === "7d"
                    ? "7 Dias"
                    : selectedPeriod === "30d"
                      ? "30 Dias"
                      : "Todo Histórico"
              }).`}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">Data/Hora</th>
                      <th className="p-3">Estratégia</th>
                      <th className="p-3">Ativo</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Compra</th>
                      <th className="p-3">Venda</th>
                      <th className="p-3">P/L Realizado</th>
                      <th className="p-3">Motivo Encerramento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClosedTrades.map((t) => {
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
                          <td className="p-3">
                            <div className="font-semibold text-white">
                              {t.strategyName || t.symbol}
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ID: {t.contractId || t.id}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-cyan-400">
                            {t.symbol}
                          </td>
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
                            {t.sellPrice ? `$${t.sellPrice.toFixed(2)}` : "-"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-bold ${isWin ? "text-emerald-500" : "text-rose-500"}`}
                            >
                              {fmtUsd(plUsd)}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {(() => {
                              const motivo = t.reason || t.status || "-";
                              const isEarlyTp =
                                motivo.includes("Take Profit") ||
                                motivo.includes("Saída Antecipada");
                              const isEarlyStop =
                                motivo.includes("Emergency Stop") ||
                                motivo.includes("Stop Antecipado");

                              if (isEarlyTp) {
                                return (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 border border-cyan-500/30">
                                    🎯 {motivo}
                                  </span>
                                );
                              }

                              if (isEarlyStop) {
                                return (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                                    🚨 {motivo}
                                  </span>
                                );
                              }

                              return motivo;
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
