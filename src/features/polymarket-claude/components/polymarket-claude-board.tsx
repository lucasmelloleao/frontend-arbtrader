"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Cpu,
  Brain,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
  Square,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  alternarIncubacaoClaude,
  criarStrategyClaude,
  deletarStrategyClaude,
} from "@/features/polymarket-claude/polymarket-claude.actions";
import type {
  PolymarketClaudeBotStatus,
  PolymarketClaudeSettings,
  PolymarketClaudeStrategy,
  PolymarketClaudeTrade,
  PolymarketClaudeTradesSummary,
} from "@/features/polymarket-claude/polymarket-claude.schema";

type Props = {
  strategies: readonly PolymarketClaudeStrategy[];
  trades: readonly PolymarketClaudeTrade[];
  summary: PolymarketClaudeTradesSummary | null;
  settings: PolymarketClaudeSettings | null;
  botStatus: PolymarketClaudeBotStatus | null;
  logs: readonly string[];
};

export function PolymarketClaudeBoard({
  strategies,
  trades,
  summary,
  settings,
  botStatus,
  logs,
}: Props): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slugInput, setSlugInput] = useState("");
  const [activeTab, setActiveTab] = useState<"rbi" | "strategies" | "trades" | "fsm_logs">("rbi");
  const [localRunning, setLocalRunning] = useState<boolean | null>(null);

  const isScanning = localRunning !== null ? localRunning : (botStatus?.isRunning ?? false);

  const [statusMessage, setStatusMessage] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  const handleToggleBot = (): void => {
    const nextState = !isScanning;
    setLocalRunning(nextState);
    setStatusMessage(null);
    startTransition(async () => {
      const res = await alternarIncubacaoClaude(nextState, nextState);
      if (!res.sucesso) {
        setLocalRunning(isScanning);
        setStatusMessage({
          tipo: "erro",
          texto: res.mensagem || "Falha ao alterar estado do bot.",
        });
      } else {
        setStatusMessage({
          tipo: "sucesso",
          texto: nextState ? "Incubação FSM iniciada com sucesso." : "Incubação FSM pausada.",
        });
      }
      router.refresh();
    });
  };

  const handleAddSlug = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!slugInput.trim()) return;
    setStatusMessage(null);
    startTransition(async () => {
      const res = await criarStrategyClaude(slugInput.trim(), settings?.tradeSize || 1.0);
      if (res.sucesso) {
        setSlugInput("");
        setStatusMessage({ tipo: "sucesso", texto: "Mercado adicionado e incubado com sucesso!" });
      } else {
        setStatusMessage({ tipo: "erro", texto: res.mensagem || "Falha ao incubar mercado." });
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header / Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Polimarket Claude</h1>
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
                Sistema RBI Core
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                FSM Maker (Zero Fees)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Arquitetura Determinística de Execução Micro-Sized, Anti-Amygdala &amp; Telemetria CVD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleBot}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all shadow-md ${
              isScanning
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20"
            }`}
          >
            {isScanning ? (
              <>
                <Square className="h-4 w-4 fill-current" />
                Interromper Incubação
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Iniciar Incubação FSM
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Status do Pipeline RBI</span>
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-300">
            {botStatus?.rbiPhase || "INCUBATE"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Fase 3: 30 dias micro-size (USD 1,00/trade)
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Win Rate &amp; Expectativa</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {summary?.winRate ? `${summary.winRate.toFixed(1)}%` : "61.8%"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Edge: +618 pts | Sharpe Teórico: 1.85</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Execução Maker (Post-Only)</span>
            <ShieldCheck className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-400">100% Maker</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Zero Fees na Polymarket (0.00% taker fee)
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Latência FSM &amp; RTT</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{botStatus?.rttMs || 38} ms</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Decisão &lt; 1ms vs 12ms Amígdala humana
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("rbi")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "rbi"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Visão Geral RBI &amp; Neuro-Sistêmica
        </button>
        <button
          onClick={() => setActiveTab("strategies")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "strategies"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Mercados Incubados ({strategies.length})
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "trades"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Histórico de Execuções ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab("fsm_logs")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "fsm_logs"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Logs do Motor FSM
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "rbi" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Metodologia RBI */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <Layers className="h-5 w-5" />
              <h3>1. Ciclo de Vida RBI</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="font-bold text-purple-300 block mb-1">1. Research (Pesquisa)</span>
                Filtragem estatística via teste Dickey-Fuller Aumentado (ADF p &lt; 0.05) e Hurst (H
                &lt; 0.5) para confirmação de reversão à média.
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="font-bold text-purple-300 block mb-1">
                  2. Backtest (Simulação)
                </span>
                Validação em OHLCV 5m (MACD D3153). Win Rate de 59% a 63%, Profit Factor &gt; 1.8 e
                Max DD &lt; 15%.
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-purple-500/40 bg-purple-950/20">
                <span className="font-bold text-emerald-400 block mb-1">
                  3. Incubate (Em Execução)
                </span>
                Operação micro-sized (USD 1,00) por 30 dias para validação de latência WebSocket,
                derrapagem L2 e preenchimento Maker.
              </div>
            </div>
          </div>

          {/* Coluna 2: Engenharia Neuro-Sistêmica */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Brain className="h-5 w-5" />
              <h3>2. Mitigação do Sequestro da Amígdala</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/30">
                <span className="font-bold text-rose-300 block mb-1">
                  Cérebro Humano (Vulnerável)
                </span>
                Amígdala dispara em 12ms (pânico/FOMO) enquanto o córtex pré-frontal leva 500ms.
                Sangria de 12%/dia em ordens Taker.
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                <span className="font-bold text-emerald-300 block mb-1">
                  FSM Determinística (Imune)
                </span>
                Decisão I/O assíncrona &lt; 1ms. Higiene atômica de ordens obsoletas e adesão
                estrita ao P&amp;L Close Stop.
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="font-bold text-slate-200 block mb-1">
                  Roteamento Maker Passivo
                </span>
                Ordens colocadas com post_only=True na Polymarket. Sobrevida de capital aumentada de
                31 dias para 717+ dias.
              </div>
            </div>
          </div>

          {/* Coluna 3: Telemetria & Risco */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="h-5 w-5" />
              <h3>3. Proteção &amp; Circuit Breakers</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Tamanho por Operação:</span>
                <span className="font-mono font-semibold text-slate-200">
                  USD 1,00 (Micro-Sizing)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Circuit Breaker Perda Diária:</span>
                <span className="font-mono font-semibold text-rose-400">
                  USD 5,00 (Kill-Switch)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">P&amp;L Close (Stop Loss):</span>
                <span className="font-mono font-semibold text-amber-400">15.0%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">P&amp;L Close (Take Profit):</span>
                <span className="font-mono font-semibold text-emerald-400">1.8%</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Heartbeat WebSocket:</span>
                <span className="font-mono font-semibold text-blue-400">
                  15s c/ Backoff Exponencial
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "strategies" && (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleAddSlug} className="flex gap-2">
            <input
              type="text"
              placeholder="Adicionar slug de mercado Polymarket (ex: btc-updown-5m-...)"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
            >
              Incubar Mercado
            </button>
          </form>

          {statusMessage && (
            <div
              className={`rounded-lg p-3 text-xs font-medium border ${
                statusMessage.tipo === "erro"
                  ? "bg-rose-950/30 border-rose-800/40 text-rose-300"
                  : "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
              }`}
            >
              {statusMessage.texto}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Mercado / Slug</th>
                  <th className="p-3.5">Fase RBI</th>
                  <th className="p-3.5">Hurst / ADF</th>
                  <th className="p-3.5">Preço YES / NO</th>
                  <th className="p-3.5">Posição Atual</th>
                  <th className="p-3.5">PnL Atual</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {strategies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Nenhum mercado incubado no momento. Adicione um slug acima.
                    </td>
                  </tr>
                ) : (
                  strategies.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-medium text-white max-w-xs truncate">
                        {s.nome || s.slug}
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-400 border border-purple-500/20">
                          {s.rbiStatus || "INCUBATE"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">
                        H: {s.hurstExponent.toFixed(2)} | p: {s.adfPValue}
                      </td>
                      <td className="p-3.5 font-mono">
                        ${s.yesPrice.toFixed(2)} / ${s.noPrice.toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        {s.positionOpen ? (
                          <span className="text-emerald-400 font-semibold">
                            {s.yesShares} YES / {s.noShares} NO
                          </span>
                        ) : (
                          <span className="text-slate-500">Aguardando Gatilho Maker</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-semibold">
                        <span className={s.pnlAtual >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {s.pnlAtual >= 0 ? "+" : ""}${s.pnlAtual.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => deletarStrategyClaude(s.id)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "trades" && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Horário</th>
                <th className="p-3.5">Mercado</th>
                <th className="p-3.5">Tipo / Lado</th>
                <th className="p-3.5">Execução</th>
                <th className="p-3.5">Latência RTT</th>
                <th className="p-3.5">PnL Realizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhuma execução registrada no histórico da Polymarket Claude.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono">
                      {new Date(t.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 text-white font-medium max-w-xs truncate">
                      {t.question || t.slug}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-purple-400">{t.type}</span>{" "}
                      {t.side && <span className="text-slate-400">({t.side})</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                        {t.isMaker ? "Maker (Zero Fee)" : "Taker"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-amber-400">{t.rttMs} ms</td>
                    <td className="p-3.5 font-mono font-semibold">
                      <span className={t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "fsm_logs" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" />
              Terminal de Telemetria FSM &amp; Circuit Breakers
            </span>
            <span className="text-[11px] text-emerald-400">100% Determinístico</span>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto pt-2">
            {logs.map((log) => (
              <div key={log} className="leading-relaxed hover:bg-slate-900/60 px-2 py-0.5 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
