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
} from "lucide-react";
import { FxProAiStrategyView } from "@/features/fxpro/components/fxpro-ai-strategy-view";
import { FxProStrategyForm } from "@/features/fxpro/components/fxpro-strategy-form";
import { FxProStrategyModal } from "@/features/fxpro/components/fxpro-strategy-modal";
import {
  alternarEstrategiaFxPro,
  buscarTradesFxPro,
  deletarEstrategiaFxPro,
} from "@/features/fxpro/fxpro.actions";
import type { FxProStrategy, FxProTrade } from "@/features/fxpro/fxpro.schema";

type FxProBoardProps = {
  strategies: readonly FxProStrategy[];
  trades: readonly FxProTrade[];
  exchangeKeys?: readonly { id: string; exchangeId: string; nome: string }[];
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

export function FxProBoard({
  strategies,
  trades: initialTrades,
  exchangeKeys = [],
}: FxProBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aba, setAba] = useState<"open" | "monitored" | "closed" | "aiStrategy">("open");
  const [criando, setCriando] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<FxProStrategy | null>(null);
  const [periodo, setPeriodo] = useState<"today" | "7d" | "30d" | "all">("today");
  const [tradesList, setTradesList] = useState<readonly FxProTrade[]>(initialTrades);
  const [carregandoTrades, setCarregandoTrades] = useState(false);

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

  const carregarPeriodo = async (p: "today" | "7d" | "30d" | "all"): Promise<void> => {
    setPeriodo(p);
    setCarregandoTrades(true);
    const res = await buscarTradesFxPro({ periodo: p });
    setCarregandoTrades(false);
    if (res.ok) {
      setTradesList(res.trades);
    }
  };

  const abertas = strategies.filter((s) => s.currentPositionId);
  const monitorando = strategies.filter((s) => !s.currentPositionId);
  const encerradas = tradesList.filter((t) => t.status === "closed");

  const executar = (acao: () => Promise<{ ok: boolean }>): void => {
    startTransition(async () => {
      await acao();
      router.refresh();
    });
  };

  const confirmarToggle = (strat: FxProStrategy): void => {
    executar(() => alternarEstrategiaFxPro(strat.id));
  };

  const confirmarExcluir = (strat: FxProStrategy): void => {
    if (!confirm(`Excluir a estratégia "${strat.name}"?`)) return;
    executar(() => deletarEstrategiaFxPro(strat.id));
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
            { key: "open", label: "Posições Abertas", count: abertas.length },
            { key: "monitored", label: "Pares Monitorados", count: monitorando.length },
            { key: "closed", label: "Histórico de Trades", count: encerradas.length },
            { key: "aiStrategy", label: "IA Meta-Labeling (Gate 4)", count: null, icon: Brain },
          ] as const
        ).map((tab) => {
          const Icon = "icon" in tab ? tab.icon : null;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAba(tab.key)}
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
          {abertas.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma posição aberta na FxPro cTrader no momento.
            </div>
          ) : (
            abertas.map((strat) => (
              <div
                key={strat.id}
                className="rounded-xl border border-indigo-500/30 bg-slate-950/70 p-5 shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-white">{strat.name}</h3>
                    <div className="mt-0.5 text-xs text-indigo-400 font-mono font-bold">
                      {strat.symbol} ({strat.timeframe})
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-base font-black ${
                        strat.currentPnlUsd > 0
                          ? "text-emerald-400"
                          : strat.currentPnlUsd < 0
                            ? "text-rose-400"
                            : "text-slate-300"
                      }`}
                    >
                      {fmtUsd(strat.currentPnlUsd)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Posição #{strat.currentPositionId}
                    </div>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-slate-900/60 p-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lado</span>
                    <div className="flex items-center gap-1 font-bold text-white">
                      {strat.currentSide === "BUY" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      {strat.currentSide} ({strat.lotSize} lotes)
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Preço Entrada
                    </span>
                    <div className="font-mono font-bold text-white">
                      {strat.entryPrice.toFixed(5)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">TP / SL</span>
                    <div className="font-mono text-[11px] text-slate-300">
                      +{strat.takeProfitPips}p / -{strat.stopLossPips}p
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] text-slate-500">
                    Alavancagem: 1:{strat.leverage}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => confirmarToggle(strat)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-500"
                    >
                      <Pause className="h-3 w-3" /> Pausar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Aba: Monitorando */}
      {aba === "monitored" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monitorando.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma estratégia FxPro cadastrada.
            </div>
          ) : (
            monitorando.map((strat) => (
              <div
                key={strat.id}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-bold text-white">{strat.name}</span>
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
                      {strat.active ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
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
                    Trades: <b className="text-white">{strat.totalTrades} ({strat.winningTrades}W)</b>
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
                encerradas.map((t) => (
                  <div
                    key={t.id || t.positionId}
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
                            t.side === "BUY" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
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
                        <div className="font-mono text-slate-300">{t.exitPrice?.toFixed(5) || "—"}</div>
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

      {/* Aba: IA Meta-Labeling (Gate 4) */}
      {aba === "aiStrategy" && <FxProAiStrategyView />}

      {/* Modal de Configuração por Ativo */}
      {editingStrategy !== null && (
        <FxProStrategyModal
          strategy={editingStrategy}
          onFechar={() => setEditingStrategy(null)}
        />
      )}
    </div>
  );
}
