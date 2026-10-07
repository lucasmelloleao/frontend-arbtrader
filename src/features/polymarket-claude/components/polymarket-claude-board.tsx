"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  BarChart3,
  Clock,
  Cpu,
  DollarSign,
  Play,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Square,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import {
  alternarIncubacaoClaude,
  alternarModoClaude,
  buscarTradesClaude,
  criarStrategyClaude,
  deletarStrategyClaude,
  salvarConfiguracoesClaude,
} from "@/features/polymarket-claude/polymarket-claude.actions";
import { UniversalTimelineChart } from "@/components/charts/universal-timeline-chart";
import type {
  PolymarketClaudeBotStatus,
  PolymarketClaudeSettings,
  PolymarketClaudeStrategy,
  PolymarketClaudeTrade,
  PolymarketClaudeTradesSummary,
} from "@/features/polymarket-claude/polymarket-claude.schema";

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;

const INTERVALOS_FILTRO = [
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
] as const;

function getCoinDetails(titleOrSlug: string): { coin: string; name: string } {
  const s = (titleOrSlug || "").toUpperCase();
  if (s.includes("BITCOIN") || s.includes("BTC")) return { coin: "BTC", name: "Bitcoin" };
  if (s.includes("ETHEREUM") || s.includes("ETH")) return { coin: "ETH", name: "Ethereum" };
  if (s.includes("SOLANA") || s.includes("SOL")) return { coin: "SOL", name: "Solana" };
  if (s.includes("XRP") || s.includes("RIPPLE")) return { coin: "XRP", name: "Ripple (XRP)" };
  if (s.includes("DOGECOIN") || s.includes("DOGE")) return { coin: "DOGE", name: "Dogecoin" };
  if (s.includes("CARDANO") || s.includes("ADA")) return { coin: "ADA", name: "Cardano" };
  if (s.includes("AVALANCHE") || s.includes("AVAX")) return { coin: "AVAX", name: "Avalanche" };
  return { coin: "OUTROS", name: "Outros Mercados" };
}

type Props = {
  strategies: readonly PolymarketClaudeStrategy[];
  trades: readonly PolymarketClaudeTrade[];
  summary: PolymarketClaudeTradesSummary | null;
  settings: PolymarketClaudeSettings | null;
  botStatus: PolymarketClaudeBotStatus | null;
  logs: readonly string[];
};

type FormSettingsState = {
  tradeSize: number;
  maxOpenPairs: number;
  enableTrailingStop: boolean;
  trailingActivationGainCents: number;
  trailingStepCents: number;
  trailingStopOffsetCents: number;
  enableTakerAggression: boolean;
  takerConfidenceThreshold: number;
  enableStopLoss: boolean;
  stopLossPercent: number;
  enableAdaptiveStopLoss: boolean;
  adaptiveStopLossUnderdogPct: number;
  adaptiveStopLossFavoritePct: number;
  adaptiveStopLossMidPct: number;
  enableKellySizing: boolean;
  kellyFraction: number;
  minTradeSize: number;
  maxTradeSize: number;
  enableCorrelationFilter: boolean;
  correlatedSizeReductionPct: number;
  enableTimeDecayBuffer: boolean;
  timeDecayBufferSeconds: number;
  timeDecayBufferMinProfitPct: number;
  enableMidPriceRebalance: boolean;
  rebalancePassiveWaitMs: number;
  enableMarketExpansion: boolean;
  minMarketVolume24h: number;
  minMarketLiquidity: number;
  minMarketTimeSeconds: number;
  enablePortfolioDrawdownBreaker: boolean;
  maxPortfolioDrawdownPct: number;
  drawdownRecoveryPct: number;
  enableHedgeMode: boolean;
  hedgeSizeFraction: number;
};

function buildSettings(s: PolymarketClaudeSettings | null): FormSettingsState {
  return {
    tradeSize: s?.tradeSize ?? 2.0,
    maxOpenPairs: s?.maxOpenPairs ?? 3,
    enableTrailingStop: s?.enableTrailingStop ?? true,
    trailingActivationGainCents: s?.trailingActivationGainCents ?? 0.1,
    trailingStepCents: s?.trailingStepCents ?? 0.01,
    trailingStopOffsetCents: s?.trailingStopOffsetCents ?? 0.01,
    enableTakerAggression: s?.enableTakerAggression ?? true,
    takerConfidenceThreshold: s?.takerConfidenceThreshold ?? 0.3,
    enableStopLoss: s?.enableStopLoss ?? true,
    stopLossPercent: s?.stopLossPercent ?? 0.5,
    enableAdaptiveStopLoss: s?.enableAdaptiveStopLoss ?? true,
    adaptiveStopLossUnderdogPct: s?.adaptiveStopLossUnderdogPct ?? 0.65,
    adaptiveStopLossFavoritePct: s?.adaptiveStopLossFavoritePct ?? 0.35,
    adaptiveStopLossMidPct: s?.adaptiveStopLossMidPct ?? 0.5,
    enableKellySizing: s?.enableKellySizing ?? true,
    kellyFraction: s?.kellyFraction ?? 0.25,
    minTradeSize: s?.minTradeSize ?? 1.0,
    maxTradeSize: s?.maxTradeSize ?? 10.0,
    enableCorrelationFilter: s?.enableCorrelationFilter ?? true,
    correlatedSizeReductionPct: s?.correlatedSizeReductionPct ?? 0.5,
    enableTimeDecayBuffer: s?.enableTimeDecayBuffer ?? true,
    timeDecayBufferSeconds: s?.timeDecayBufferSeconds ?? 7200,
    timeDecayBufferMinProfitPct: s?.timeDecayBufferMinProfitPct ?? 0.05,
    enableMidPriceRebalance: s?.enableMidPriceRebalance ?? true,
    rebalancePassiveWaitMs: s?.rebalancePassiveWaitMs ?? 5000,
    enableMarketExpansion: s?.enableMarketExpansion ?? true,
    minMarketVolume24h: s?.minMarketVolume24h ?? 10000,
    minMarketLiquidity: s?.minMarketLiquidity ?? 5000,
    minMarketTimeSeconds: s?.minMarketTimeSeconds ?? 3600,
    enablePortfolioDrawdownBreaker: s?.enablePortfolioDrawdownBreaker ?? true,
    maxPortfolioDrawdownPct: s?.maxPortfolioDrawdownPct ?? 0.1,
    drawdownRecoveryPct: s?.drawdownRecoveryPct ?? 0.05,
    enableHedgeMode: s?.enableHedgeMode ?? false,
    hedgeSizeFraction: s?.hedgeSizeFraction ?? 0.3,
  };
}

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
  const [activeTab, setActiveTab] = useState<
    "rbi" | "strategies" | "trades" | "performance" | "fsm_logs"
  >("rbi");
  const [localRunning, setLocalRunning] = useState<boolean | null>(null);

  // Estados da aba Lucro/Prejuízo por Ativo
  const [perfPeriod, setPerfPeriod] = useState<string>("all");
  const [perfTrades, setPerfTrades] = useState<readonly PolymarketClaudeTrade[]>(trades);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [perfConsulted, setPerfConsulted] = useState(true);

  const [previousTrades, setPreviousTrades] = useState(trades);
  const previousTradesRef = useRef<readonly PolymarketClaudeTrade[]>(trades);
  useEffect(() => {
    previousTradesRef.current = previousTrades;
  }, [previousTrades]);
  useEffect(() => {
    if (trades === previousTradesRef.current) return;
    queueMicrotask(() => {
      setPreviousTrades(trades);
      if (perfPeriod === "all") {
        setPerfTrades(trades);
      }
    });
  }, [trades, perfPeriod]);

  const consultarPerformance = async (p: string): Promise<void> => {
    setPerfPeriod(p);
    setLoadingPerf(true);
    setPerfConsulted(true);
    const res = await buscarTradesClaude(p);
    setLoadingPerf(false);
    setPerfTrades(res);
  };

  const isScanning = localRunning !== null ? localRunning : (botStatus?.isRunning ?? false);
  const [localLive, setLocalLive] = useState<boolean | null>(null);
  const isLive = localLive !== null ? localLive : Boolean(settings?.allowLiveTrading);

  // Auto-refresh a cada 6s para acompanhar telemetria em tempo real sem engasgar
  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, 6000);
    return () => clearInterval(timer);
  }, [router]);

  const handleToggleMode = (): void => {
    const nextLive = !isLive;
    if (
      nextLive &&
      !window.confirm(
        "Ativar MODO REAL? O robô passará a enviar ordens com USD real na Polymarket.",
      )
    ) {
      return;
    }
    setLocalLive(nextLive);
    setStatusMessage(null);
    startTransition(async () => {
      const res = await alternarModoClaude(nextLive);
      if (!res.sucesso) {
        setLocalLive(isLive);
        setStatusMessage({ tipo: "erro", texto: res.mensagem || "Falha ao alterar modo." });
      } else {
        setStatusMessage({
          tipo: "sucesso",
          texto: nextLive ? "Modo REAL ativado." : "Modo SIMULADO ativado (sem dinheiro real).",
        });
      }
      router.refresh();
    });
  };

  const [statusMessage, setStatusMessage] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  const handleToggleBot = (): void => {
    const nextState = !isScanning;
    setLocalRunning(nextState);
    setStatusMessage(null);
    startTransition(async () => {
      const res = await alternarIncubacaoClaude(nextState);
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

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [formSettings, setFormSettings] = useState<FormSettingsState>(buildSettings(settings));
  const prevSettingsRef = useRef<PolymarketClaudeSettings | null>(null);

  useEffect(() => {
    prevSettingsRef.current = settings;
    if (settings) {
      queueMicrotask(() => setFormSettings(buildSettings(settings)));
    }
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent): void => {
    e.preventDefault();
    setStatusMessage(null);
    startTransition(async () => {
      const res = await salvarConfiguracoesClaude(formSettings);
      if (res.sucesso) {
        setShowSettingsModal(false);
        setStatusMessage({
          tipo: "sucesso",
          texto: "Configurações de Trailing Stop e Risco salvas com sucesso!",
        });
      } else {
        setStatusMessage({ tipo: "erro", texto: res.mensagem || "Falha ao salvar configurações." });
      }
      router.refresh();
    });
  };

  const handleAddSlug = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!slugInput.trim()) return;
    setStatusMessage(null);
    startTransition(async () => {
      const res = await criarStrategyClaude(slugInput.trim(), formSettings.tradeSize || 1.0);
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
      {/* Modal de Configurações & Trailing Stop */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg mx-auto my-8 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Header sticky */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <SettingsIcon className="h-5 w-5 text-purple-400" />
                Configurações da Estratégia
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form scrollável com max-height fixo */}
            <form
              onSubmit={handleSaveSettings}
              className="flex flex-col max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              {/* Conteúdo com padding */}
              <div className="p-6 flex flex-col gap-4 text-xs">
                <label htmlFor="tradeSize" className="text-slate-400 block mb-1 font-medium">
                  Tamanho da Entrada ($ USD)
                </label>
                <input
                  id="tradeSize"
                  type="number"
                  step="0.5"
                  min="1"
                  value={formSettings.tradeSize}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, tradeSize: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="maxOpenPairs" className="text-slate-400 block mb-1 font-medium">
                  Máx Mercados Simultâneos
                </label>
                <input
                  id="maxOpenPairs"
                  type="number"
                  min="1"
                  max="10"
                  value={formSettings.maxOpenPairs}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, maxOpenPairs: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Seção Trailing Stop Dinâmico */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300">Trailing Stop Dinâmico</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableTrailingStop}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableTrailingStop: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-purple-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Quando a cotação sobe o valor de ativação, o stop é ajustado para o preço de
                  entrada ($0 de perda). Para cada avanço adicional no lucro, o stop sobe
                  continuamente.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label htmlFor="trailingGain" className="text-slate-400 block mb-1">
                      Gatilho ($ USD)
                    </label>
                    <input
                      id="trailingGain"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.50"
                      value={formSettings.trailingActivationGainCents}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          trailingActivationGainCents: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                      title="Ex: 0.10 para subir stop ao 0 quando lucrar 10 centavos"
                    />
                    <span className="text-[10px] text-slate-500">Ex: 0.10 = 10¢</span>
                  </div>
                  <div>
                    <label htmlFor="trailingStep" className="text-slate-400 block mb-1">
                      A Cada Lucro ($)
                    </label>
                    <input
                      id="trailingStep"
                      type="number"
                      step="0.01"
                      min="0.005"
                      max="0.10"
                      value={formSettings.trailingStepCents}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          trailingStepCents: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                      title="Passo de incremento de ganho"
                    />
                    <span className="text-[10px] text-slate-500">Ex: 0.01 = 1¢</span>
                  </div>
                  <div>
                    <label htmlFor="trailingOffset" className="text-slate-400 block mb-1">
                      Subir Stop ($)
                    </label>
                    <input
                      id="trailingOffset"
                      type="number"
                      step="0.01"
                      min="0.005"
                      max="0.10"
                      value={formSettings.trailingStopOffsetCents}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          trailingStopOffsetCents: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                      title="Aumento no preço de stop"
                    />
                    <span className="text-[10px] text-slate-500">Ex: 0.01 = 1¢</span>
                  </div>
                </div>
              </div>

              {/* Seção Agressão Taker */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">
                    Agressão Taker (Cruzar Spread)
                  </span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableTakerAggression}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableTakerAggression: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Com confiança acima do limite, compra pagando o Ask (fill imediato) em vez de
                  aguardar ordem passiva no Bid.
                </p>
                <div>
                  <label htmlFor="takerConf" className="text-slate-400 block mb-1">
                    Confiança Mínima para Taker (%)
                  </label>
                  <input
                    id="takerConf"
                    type="number"
                    step="1"
                    min="20"
                    max="100"
                    value={Math.round(formSettings.takerConfidenceThreshold * 100)}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        takerConfidenceThreshold: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seção Stop Loss Adaptativo */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-300">
                    Stop Loss Adaptativo (Baseado em Odds)
                  </span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableAdaptiveStopLoss}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableAdaptiveStopLoss: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-rose-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Underdog (&lt;40%): stop 65% tolerante. Coin-flip (40-60%): stop 50%. Favorito
                  (&gt;60%): stop 35% protetor.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="stopUnderdog" className="text-slate-400 block mb-1 text-[10px]">
                      Underdog (%)
                    </label>
                    <input
                      id="stopUnderdog"
                      type="number"
                      step="5"
                      min="30"
                      max="90"
                      value={Math.round(formSettings.adaptiveStopLossUnderdogPct * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          adaptiveStopLossUnderdogPct: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="stopMid" className="text-slate-400 block mb-1 text-[10px]">
                      Coin-Flip (%)
                    </label>
                    <input
                      id="stopMid"
                      type="number"
                      step="5"
                      min="20"
                      max="80"
                      value={Math.round(formSettings.adaptiveStopLossMidPct * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          adaptiveStopLossMidPct: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="stopFav" className="text-slate-400 block mb-1 text-[10px]">
                      Favorito (%)
                    </label>
                    <input
                      id="stopFav"
                      type="number"
                      step="5"
                      min="15"
                      max="70"
                      value={Math.round(formSettings.adaptiveStopLossFavoritePct * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          adaptiveStopLossFavoritePct: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Kelly Criterion Sizing */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300">Kelly Criterion Sizing</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableKellySizing}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableKellySizing: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tamanho dinâmico baseado no Kelly Criterion. Aposta maior quando o edge
                  (Sharpe/probabilidade) é maior.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="kellyFrac" className="text-slate-400 block mb-1 text-[10px]">
                      Fração do Kelly (%)
                    </label>
                    <input
                      id="kellyFrac"
                      type="number"
                      step="5"
                      min="5"
                      max="100"
                      value={Math.round(formSettings.kellyFraction * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          kellyFraction: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="minSize" className="text-slate-400 block mb-1 text-[10px]">
                      Tamanho Mín. ($)
                    </label>
                    <input
                      id="minSize"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="5"
                      value={formSettings.minTradeSize}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, minTradeSize: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxSize" className="text-slate-400 block mb-1 text-[10px]">
                      Tamanho Máx. ($)
                    </label>
                    <input
                      id="maxSize"
                      type="number"
                      step="1"
                      min="5"
                      max="50"
                      value={formSettings.maxTradeSize}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, maxTradeSize: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Correlação */}
              <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-orange-300">Filtro de Correlação</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableCorrelationFilter}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        enableCorrelationFilter: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded accent-orange-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Evita exposição dupla em mercados correlacionados (ex: BTC-UP e BTC-DOWN ao mesmo
                  tempo).
                </p>
                <div>
                  <label htmlFor="corrReduction" className="text-slate-400 block mb-1 text-[10px]">
                    Redução de Size se Correlacionado (%)
                  </label>
                  <input
                    id="corrReduction"
                    type="number"
                    step="10"
                    min="10"
                    max="80"
                    value={Math.round(formSettings.correlatedSizeReductionPct * 100)}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        correlatedSizeReductionPct: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seção Time-Decay Buffer */}
              <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-300">Time-Decay Buffer</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableTimeDecayBuffer}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableTimeDecayBuffer: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-teal-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Força saída com lucro antes do vencimento para evitar convergência pra 0.50 em
                  markets maduros.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="tdbSeconds" className="text-slate-400 block mb-1 text-[10px]">
                      Forçar Saída (seg antes)
                    </label>
                    <input
                      id="tdbSeconds"
                      type="number"
                      step="300"
                      min="300"
                      max="14400"
                      value={formSettings.timeDecayBufferSeconds}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          timeDecayBufferSeconds: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="tdbProfit" className="text-slate-400 block mb-1 text-[10px]">
                      Lucro Mín. p/ Forçar (%)
                    </label>
                    <input
                      id="tdbProfit"
                      type="number"
                      step="1"
                      min="1"
                      max="30"
                      value={Math.round(formSettings.timeDecayBufferMinProfitPct * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          timeDecayBufferMinProfitPct: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Rebalance Mid-Price */}
              <div className="rounded-xl border border-lime-500/20 bg-lime-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lime-300">Rebalance via Mid-Price</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableMidPriceRebalance}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        enableMidPriceRebalance: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded accent-lime-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ao rebalancear, tenta vender pelo mid-price (ordem passiva) antes de cruzar spread
                  como taker.
                </p>
                <div>
                  <label htmlFor="rbWait" className="text-slate-400 block mb-1 text-[10px]">
                    Espera Passiva (ms)
                  </label>
                  <input
                    id="rbWait"
                    type="number"
                    step="1000"
                    min="1000"
                    max="15000"
                    value={formSettings.rebalancePassiveWaitMs}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        rebalancePassiveWaitMs: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-lime-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seção Drawdown Circuit Breaker */}
              <div className="rounded-xl border border-pink-500/20 bg-pink-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-pink-300">Drawdown Circuit Breaker</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enablePortfolioDrawdownBreaker}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        enablePortfolioDrawdownBreaker: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded accent-pink-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pausa todas as operações se o drawdown do portfólio exceder o limite. Reabre
                  automaticamente ao recuperar.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="maxDD" className="text-slate-400 block mb-1 text-[10px]">
                      Drawdown Máx. (%)
                    </label>
                    <input
                      id="maxDD"
                      type="number"
                      step="1"
                      min="5"
                      max="30"
                      value={Math.round(formSettings.maxPortfolioDrawdownPct * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          maxPortfolioDrawdownPct: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="recoveryDD" className="text-slate-400 block mb-1 text-[10px]">
                      Reabrir em (%)
                    </label>
                    <input
                      id="recoveryDD"
                      type="number"
                      step="1"
                      min="1"
                      max="15"
                      value={Math.round(formSettings.drawdownRecoveryPct * 100)}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          drawdownRecoveryPct: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Expansão de Mercados */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-violet-300">Expansão de Mercados</span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableMarketExpansion}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableMarketExpansion: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-violet-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permite operar mercados além de BTC/ETH/SOL. Filtra por volume, liquidez e tempo
                  mínimo até o vencimento.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="minVol" className="text-slate-400 block mb-1 text-[10px]">
                      Volume Mín. 24h ($)
                    </label>
                    <input
                      id="minVol"
                      type="number"
                      step="1000"
                      min="1000"
                      max="100000"
                      value={formSettings.minMarketVolume24h}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          minMarketVolume24h: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="minLiq" className="text-slate-400 block mb-1 text-[10px]">
                      Liquidez Mín. ($)
                    </label>
                    <input
                      id="minLiq"
                      type="number"
                      step="1000"
                      min="500"
                      max="50000"
                      value={formSettings.minMarketLiquidity}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          minMarketLiquidity: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="minTime" className="text-slate-400 block mb-1 text-[10px]">
                      Tempo Mín. (seg)
                    </label>
                    <input
                      id="minTime"
                      type="number"
                      step="300"
                      min="300"
                      max="36000"
                      value={formSettings.minMarketTimeSeconds}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          minMarketTimeSeconds: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono text-xs focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Stop Loss de Proteção (fallback) */}
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-300">
                    Stop Loss de Proteção (Fallback)
                  </span>
                  <input
                    type="checkbox"
                    checked={formSettings.enableStopLoss}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, enableStopLoss: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-red-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Limita a perda máxima por operação. Ativo mesmo se o Stop Adaptativo estiver
                  desligado.
                </p>
                <div>
                  <label htmlFor="stopLossPct" className="text-slate-400 block mb-1">
                    Perda Máxima Permitida (%)
                  </label>
                  <input
                    id="stopLossPct"
                    type="number"
                    step="5"
                    min="10"
                    max="90"
                    value={Math.round(formSettings.stopLossPercent * 100)}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        stopLossPercent: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    Ex: 50% = perder no máximo 50% do valor investido
                  </span>
                </div>
              </div>

              {/* Footer fixo */}
              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-800 bg-slate-900 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/20"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  isScanning
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isScanning ? "bg-emerald-400 animate-ping" : "bg-slate-500"
                  }`}
                />
                {isScanning ? "MOTOR RODANDO (ATIVO)" : "MOTOR PAUSADO"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Arquitetura Determinística Direcional, Trailing Stop Protetivo &amp; Telemetria CVD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Ajustar Parâmetros e Trailing Stop"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all shadow-sm"
          >
            <SettingsIcon className="h-4 w-4 text-purple-400" />
            Configurações
          </button>
          <button
            id="polymarket-claude-mode-toggle"
            onClick={handleToggleMode}
            disabled={isPending}
            title="Alternar entre modo simulado e modo real"
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all border ${
              isLive
                ? "bg-rose-600/20 text-rose-300 border-rose-500/50 hover:bg-rose-600/30"
                : "bg-sky-500/10 text-sky-300 border-sky-500/40 hover:bg-sky-500/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isLive ? "bg-rose-400 animate-pulse" : "bg-sky-400"}`}
            />
            {isLive ? "Modo REAL" : "Modo SIMULADO"}
          </button>
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

      {/* Painel Financeiro Consolidado: Saldo & Resumo Live vs Simulado */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Saldo On-Chain da Wallet */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Saldo Real (Deposit Wallet)</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            ${(summary?.live?.balanceUsd ?? 0).toFixed(2)}{" "}
            <span className="text-xs font-normal text-slate-400">USDC (pUSD)</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Polygon On-Chain • Capital disponível para operar
          </p>
        </div>

        {/* Card 2: PnL Realizado (MODO REAL) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              PnL Realizado (LIVE)
            </span>
            <DollarSign className="h-4 w-4 text-rose-400" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold font-mono ${
              (summary?.live?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {(summary?.live?.totalPnl ?? 0) >= 0 ? "+" : ""}$
            {(summary?.live?.totalPnl ?? 0).toFixed(4)}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
            <span className="text-emerald-400">{summary?.live?.winningTrades ?? 0}V</span>
            <span>/</span>
            <span className="text-rose-400">{summary?.live?.losingTrades ?? 0}D</span>
            <span>• WinRate: {(summary?.live?.winRate ?? 0).toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: PnL Simulado (MODO SIMULADO) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              PnL Estimado (SIMULADO)
            </span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold font-mono ${
              (summary?.simulated?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {(summary?.simulated?.totalPnl ?? 0) >= 0 ? "+" : ""}$
            {(summary?.simulated?.totalPnl ?? 0).toFixed(4)}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
            <span className="text-emerald-400">{summary?.simulated?.winningTrades ?? 0}V</span>
            <span>/</span>
            <span className="text-rose-400">{summary?.simulated?.losingTrades ?? 0}D</span>
            <span>• WinRate: {(summary?.simulated?.winRate ?? 0).toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 4: Status do Motor & Latência */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Estado do Motor</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-200">{isLive ? "LIVE" : "PAPER"}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Tamanho: USD {(settings?.tradeSize ?? 2.0).toFixed(2)} • RTT: {botStatus?.rttMs || 38}ms
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
          Resumo Live vs Simulado
        </button>
        <button
          onClick={() => setActiveTab("strategies")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "strategies"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Mercados Correntes ({strategies.length})
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "trades"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Histórico de Operações ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "performance"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Lucro/Prejuízo por Ativo
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel Discriminado: Modo REAL */}
          <div className="rounded-xl border border-rose-950/40 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3>Resultados em MODO REAL (LIVE)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {summary?.live?.totalTrades ?? 0} operações
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">PnL Líquido Realizado</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    (summary?.live?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {(summary?.live?.totalPnl ?? 0) >= 0 ? "+" : ""}$
                  {(summary?.live?.totalPnl ?? 0).toFixed(4)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Taxa de Acerto (Win Rate)</span>
                <span className="text-lg font-bold font-mono text-slate-200">
                  {(summary?.live?.winRate ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Vitórias / Derrotas</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {summary?.live?.winningTrades ?? 0}V{" "}
                  <span className="text-rose-400">/ {summary?.live?.losingTrades ?? 0}D</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Volume Notional</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  ${(summary?.live?.volumeUsd ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Painel Discriminado: Modo SIMULADO */}
          <div className="rounded-xl border border-sky-950/40 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sky-300 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                <h3>Resultados em MODO SIMULADO (PAPER)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {summary?.simulated?.totalTrades ?? 0} operações
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">PnL Estimado</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    (summary?.simulated?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {(summary?.simulated?.totalPnl ?? 0) >= 0 ? "+" : ""}$
                  {(summary?.simulated?.totalPnl ?? 0).toFixed(4)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Taxa de Acerto (Win Rate)</span>
                <span className="text-lg font-bold font-mono text-slate-200">
                  {(summary?.simulated?.winRate ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Vitórias / Derrotas</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {summary?.simulated?.winningTrades ?? 0}V{" "}
                  <span className="text-rose-400">/ {summary?.simulated?.losingTrades ?? 0}D</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Volume Notional</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  ${(summary?.simulated?.volumeUsd ?? 0).toFixed(2)}
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
                    <td className="p-3.5 flex gap-1.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                          t.status === "simulated"
                            ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {t.status === "simulated" ? "SIMULADO" : "REAL"}
                      </span>
                      <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                        {t.type === "rebalance" ? "Taker" : "Maker"}
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

      {activeTab === "performance" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Clock className="h-4 w-4 text-purple-400" />
                Intervalo:
              </span>
              {INTERVALOS_FILTRO.map((p) => {
                const isSelected = perfPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPerfPeriod(p.id);
                      void consultarPerformance(p.id);
                    }}
                    disabled={loadingPerf}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white"
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
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-all hover:bg-purple-500 disabled:opacity-50"
            >
              <Search className={`h-3.5 w-3.5 ${loadingPerf ? "animate-spin" : ""}`} />
              {loadingPerf ? "Consultando..." : "Consultar Agora"}
            </button>
          </div>

          {loadingPerf ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm font-semibold text-purple-400">
              Carregando dados consolidados da Polymarket Claude...
            </div>
          ) : !perfConsulted ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-purple-400 opacity-60" />
              <h3 className="mt-3 text-base font-bold text-white">Consulta sob Demanda</h3>
              <p className="mt-1 text-xs text-slate-400">
                Selecione o intervalo de tempo acima e clique em Consultar para analisar os lucros e
                prejuízos por ativo da Polymarket Claude.
              </p>
            </div>
          ) : (
            (() => {
              const closedPerfTrades = perfTrades.filter(
                (t) =>
                  t.type !== "fee" &&
                  (t.type === "expiration_resolve" ||
                    t.type === "trailing_stop_exit" ||
                    t.type === "close_pair" ||
                    t.type === "rebalance" ||
                    t.pnl !== 0 ||
                    Boolean(t.realizedUsd && t.realizedUsd > 0)),
              );

              if (closedPerfTrades.length === 0) {
                return (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm text-slate-400">
                    Nenhuma operação encerrada encontrada no período selecionado ({perfPeriod}).
                  </div>
                );
              }

              const coinMap = new Map<
                string,
                {
                  coin: string;
                  name: string;
                  totalTrades: number;
                  wins: number;
                  losses: number;
                  invested: number;
                  realized: number;
                  pnl: number;
                  markets: {
                    slug: string;
                    question: string;
                    pnl: number;
                    invested: number;
                    realized: number;
                    wins: number;
                    losses: number;
                  }[];
                }
              >();

              closedPerfTrades.forEach((t) => {
                const text = `${t.question || ""} ${t.slug || ""}`;
                const { coin, name } = getCoinDetails(text);
                const pnl = t.pnl || 0;
                const isWin = pnl > 0;
                const isLoss = pnl < 0;
                const invested = t.investedUsd || t.amount || 0;
                const realized = t.realizedUsd || 0;

                let entry = coinMap.get(coin);
                if (!entry) {
                  entry = {
                    coin,
                    name,
                    totalTrades: 0,
                    wins: 0,
                    losses: 0,
                    invested: 0,
                    realized: 0,
                    pnl: 0,
                    markets: [],
                  };
                  coinMap.set(coin, entry);
                }

                entry.totalTrades += 1;
                if (isWin) entry.wins += 1;
                else if (isLoss) entry.losses += 1;
                entry.invested += invested;
                entry.realized += realized;
                entry.pnl += pnl;

                const mSlug = t.slug || "mercado";
                let mItem = entry.markets.find((m) => m.slug === mSlug);
                if (!mItem) {
                  mItem = {
                    slug: mSlug,
                    question: t.question || t.slug || "Mercado",
                    pnl: 0,
                    invested: 0,
                    realized: 0,
                    wins: 0,
                    losses: 0,
                  };
                  entry.markets.push(mItem);
                }
                mItem.pnl += pnl;
                mItem.invested += invested;
                mItem.realized += realized;
                if (isWin) mItem.wins += 1;
                else if (isLoss) mItem.losses += 1;
              });

              const groupedCoins = Array.from(coinMap.values()).toSorted((a, b) => b.pnl - a.pnl);
              const totalPeriodPnl = groupedCoins.reduce((acc, i) => acc + i.pnl, 0);
              const totalPeriodTrades = groupedCoins.reduce((acc, i) => acc + i.totalTrades, 0);
              const totalPeriodWins = groupedCoins.reduce((acc, i) => acc + i.wins, 0);
              const totalPeriodLosses = groupedCoins.reduce((acc, i) => acc + i.losses, 0);
              const totalPeriodInvested = groupedCoins.reduce((acc, i) => acc + i.invested, 0);
              const totalPeriodRealized = groupedCoins.reduce((acc, i) => acc + i.realized, 0);
              const totalPeriodWinRate =
                totalPeriodTrades > 0 ? (totalPeriodWins / totalPeriodTrades) * 100 : 0;

              return (
                <div className="space-y-4">
                  {/* Resumo do Período */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm">
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

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Total de Trades
                      </span>
                      <div className="mt-1 font-mono text-xl font-black text-white">
                        {totalPeriodTrades} ({totalPeriodWins}W / {totalPeriodLosses}L)
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Taxa de Acerto (Win Rate)
                      </span>
                      <div className="mt-1 font-mono text-xl font-black text-purple-400">
                        {totalPeriodWinRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Investido / Realizado
                      </span>
                      <div className="mt-1 font-mono text-sm font-bold text-slate-200">
                        ${totalPeriodInvested.toFixed(2)} /{" "}
                        <span className="text-emerald-400">${totalPeriodRealized.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Linha do Tempo de P/L por Ativo */}
                  <UniversalTimelineChart
                    title="Curva de Ganho e Perda na Linha do Tempo Polymarket Claude (P/L Acumulado por Ativo)"
                    subtitle="Evolução cumulativa de resultados por criptoativo operado no período selecionado."
                    badgeColor="bg-purple-500"
                    trades={closedPerfTrades.map((t) => {
                      const { coin } = getCoinDetails((t.question || "") + " " + (t.slug || ""));
                      return {
                        id: t.id,
                        symbol: coin,
                        pnl: t.pnl || 0,
                        status: t.status,
                        timestamp: new Date(t.createdAt || 0).getTime(),
                      };
                    })}
                  />

                  {/* Tabela Agrupada por Moeda / Criptoativo */}
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
                    <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                        Performance Consolidada por Moeda (Criptoativo)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Moeda / Ativo</th>
                            <th className="px-4 py-3 text-center">Trades</th>
                            <th className="px-4 py-3 text-center">Vitórias</th>
                            <th className="px-4 py-3 text-center">Derrotas</th>
                            <th className="px-4 py-3 text-center">Win Rate</th>
                            <th className="px-4 py-3 text-right">Investido</th>
                            <th className="px-4 py-3 text-right">Realizado</th>
                            <th className="px-4 py-3 text-right">P/L Líquido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {groupedCoins.map((item) => {
                            const wr =
                              item.totalTrades > 0 ? (item.wins / item.totalTrades) * 100 : 0;
                            const isPositive = item.pnl >= 0;
                            return (
                              <tr
                                key={item.coin}
                                className="transition-colors hover:bg-slate-800/40"
                              >
                                <td className="px-4 py-3 font-sans" aria-label="Moeda / Ativo">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-black text-purple-300 font-mono">
                                      {item.coin}
                                    </span>
                                    <div>
                                      <div className="font-bold text-white">{item.name}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {item.markets.length}{" "}
                                        {item.markets.length === 1 ? "mercado" : "mercados"}{" "}
                                        operados
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-300 font-bold">
                                  {item.totalTrades}
                                </td>
                                <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                                  {item.wins}
                                </td>
                                <td className="px-4 py-3 text-center text-rose-400 font-bold">
                                  {item.losses}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                                      wr >= 50
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-rose-500/20 text-rose-300"
                                    }`}
                                  >
                                    {wr.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-300">
                                  ${item.invested.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-300">
                                  ${item.realized.toFixed(2)}
                                </td>
                                <td
                                  className={`px-4 py-3 text-right font-black text-sm ${
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
