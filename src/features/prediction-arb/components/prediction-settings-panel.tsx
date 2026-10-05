"use client";

import { useEffect, useState, useTransition } from "react";

import { Brain, ChevronDown, Save, Settings } from "lucide-react";

import {
  buscarStatusMetaLabelingPolymarket,
  salvarSettings,
} from "@/features/prediction-arb/prediction-arb.actions";
import type {
  PredictionArbSettings,
  PredictionMetaModelStatus,
} from "@/features/prediction-arb/prediction-arb.schema";

type PredictionSettingsPanelProps = {
  settings: PredictionArbSettings | null;
};

/**
 * Painel de configurações expansível do robô de Prediction Markets (Polymarket Arb).
 */
export function PredictionSettingsPanel({
  settings,
}: PredictionSettingsPanelProps): React.ReactNode {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [isScanningEnabled, setIsScanningEnabled] = useState(settings?.isScanningEnabled ?? false);
  const [tradeSize, setTradeSize] = useState(settings?.tradeSize ?? 100);
  const [minVolume24hUSD, setMinVolume24hUSD] = useState(settings?.minVolume24hUSD ?? 5000);
  const [maxOpenPairs, setMaxOpenPairs] = useState(settings?.maxOpenPairs ?? 3);
  const [maxSlippagePct, setMaxSlippagePct] = useState(settings?.maxSlippagePct ?? 0.1);
  const [maxDailyLoss, setMaxDailyLoss] = useState(settings?.maxDailyLoss ?? 10);
  const [minHighCertaintyProb5m, setMinHighCertaintyProb5m] = useState(
    settings?.minHighCertaintyProb5m ?? 0.95,
  );
  const [minHighCertaintyProb15m, setMinHighCertaintyProb15m] = useState(
    settings?.minHighCertaintyProb15m ?? 0.91,
  );
  const [minWatchCertaintyProb, setMinWatchCertaintyProb] = useState(
    settings?.minWatchCertaintyProb ?? 0.9,
  );
  const [maxEntrySecondsBeforeExpiry5mAlt, setMaxEntrySecondsBeforeExpiry5mAlt] = useState(
    settings?.maxEntrySecondsBeforeExpiry5mAlt ?? 60,
  );
  const [maxEntrySecondsBeforeExpiry5mMaj, setMaxEntrySecondsBeforeExpiry5mMaj] = useState(
    settings?.maxEntrySecondsBeforeExpiry5mMaj ?? 120,
  );
  const [maxEntrySecondsBeforeExpiry15mAlt, setMaxEntrySecondsBeforeExpiry15mAlt] = useState(
    settings?.maxEntrySecondsBeforeExpiry15mAlt ?? 120,
  );
  const [maxEntrySecondsBeforeExpiry15mMaj, setMaxEntrySecondsBeforeExpiry15mMaj] = useState(
    settings?.maxEntrySecondsBeforeExpiry15mMaj ?? 300,
  );
  const [stopLossPct, setStopLossPct] = useState(settings?.stopLossPct ?? 25.0);
  const [minTakeProfitPct, setMinTakeProfitPct] = useState(settings?.minTakeProfitPct ?? 2.0);
  const [minAiConfidence, setMinAiConfidence] = useState(settings?.minAiConfidence ?? 0.5);
  const [minSpotDistancePctAlt, setMinSpotDistancePctAlt] = useState(
    settings?.minSpotDistancePctAlt ?? 0.05,
  );
  const [minSpotDistancePctMaj, setMinSpotDistancePctMaj] = useState(
    settings?.minSpotDistancePctMaj ?? 0.04,
  );
  const [atrMultiplier5m, setAtrMultiplier5m] = useState(settings?.atrMultiplier5m ?? 0.25);
  const [atrMultiplier15m, setAtrMultiplier15m] = useState(settings?.atrMultiplier15m ?? 0.8);
  const [maxSideSpreadUsd, setMaxSideSpreadUsd] = useState(settings?.maxSideSpreadUsd ?? 0.1);
  const [minKaufmanEr, setMinKaufmanEr] = useState(settings?.minKaufmanEr ?? 0.2);
  const [minEdgePct, setMinEdgePct] = useState(settings?.minEdgePct ?? 1.0);
  const [mertonWeight, setMertonWeight] = useState(settings?.mertonWeight ?? 0.35);
  const [earlyConvictionMinProbPct, setEarlyConvictionMinProbPct] = useState(
    settings?.earlyConvictionMinProbPct ?? 80,
  );
  const [aiStatus, setAiStatus] = useState<PredictionMetaModelStatus | null>(null);

  useEffect(() => {
    if (aberto) {
      const carregarStatus = async (): Promise<void> => {
        try {
          const res = await buscarStatusMetaLabelingPolymarket();
          if (res.ok) {
            setAiStatus(res.data);
          }
        } catch {}
      };
      void carregarStatus();
    }
  }, [aberto]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setMensagem(null);

    startTransition(async () => {
      const res = await salvarSettings({
        isScanningEnabled,
        tradeSize,
        minVolume24hUSD,
        maxOpenPairs,
        maxSlippagePct,
        maxDailyLoss,
        minHighCertaintyProb5m,
        minHighCertaintyProb15m,
        minWatchCertaintyProb,
        maxEntrySecondsBeforeExpiry5mAlt,
        maxEntrySecondsBeforeExpiry5mMaj,
        maxEntrySecondsBeforeExpiry15mAlt,
        maxEntrySecondsBeforeExpiry15mMaj,
        stopLossPct,
        minTakeProfitPct,
        minAiConfidence,
        minSpotDistancePctAlt,
        minSpotDistancePctMaj,
        atrMultiplier5m,
        atrMultiplier15m,
        maxSideSpreadUsd,
        minKaufmanEr,
        minEdgePct,
        mertonWeight,
        earlyConvictionMinProbPct,
      });

      if (res.ok) {
        setMensagem({ tipo: "ok", texto: "Configurações salvas com sucesso!" });
      } else {
        setMensagem({ tipo: "erro", texto: res.erro });
      }
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between font-semibold text-white"
      >
        <span className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          Configurações do Robô (Polymarket)
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {mensagem !== null ? (
            <div
              className={`rounded-lg p-3 text-xs font-semibold ${
                mensagem.tipo === "ok"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {mensagem.texto}
            </div>
          ) : null}

          {/* Seção 1: Parâmetros Gerais e de Capital */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Geral & Gerenciamento de Capital
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Habilitar Scanner */}
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div>
                  <label
                    htmlFor="scan-enabled"
                    className="cursor-pointer text-xs font-semibold text-white"
                  >
                    Auto-Scanner Ativo
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Monitorar Gamma API por oportunidades
                  </p>
                </div>
                <input
                  id="scan-enabled"
                  type="checkbox"
                  checked={isScanningEnabled}
                  onChange={(e) => setIsScanningEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {/* Trade Size */}
              <div>
                <label
                  htmlFor="trade-size-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Aporte Padrão por Par (USDT)
                </label>
                <input
                  id="trade-size-input"
                  type="number"
                  value={tradeSize}
                  onChange={(e) => setTradeSize(Number(e.target.value))}
                  min={1}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Volume Mínimo 24h */}
              <div>
                <label
                  htmlFor="min-vol-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Volume Mínimo 24h (USD)
                </label>
                <input
                  id="min-vol-input"
                  type="number"
                  value={minVolume24hUSD}
                  onChange={(e) => setMinVolume24hUSD(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Limite de Perda Diária */}
              <div>
                <label
                  htmlFor="max-daily-loss-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Limite de Perda Diária (USD)
                </label>
                <input
                  id="max-daily-loss-input"
                  type="number"
                  min={0}
                  step="0.5"
                  value={maxDailyLoss}
                  onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Para de abrir posições novas quando a perda do dia atingir este valor.
                </p>
              </div>

              {/* Máximo de Pares Simultâneos */}
              <div>
                <label
                  htmlFor="max-open-pairs-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Máximo de Pares Simultâneos
                </label>
                <input
                  id="max-open-pairs-input"
                  type="number"
                  min={1}
                  step={1}
                  value={maxOpenPairs}
                  onChange={(e) => setMaxOpenPairs(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Quantas posições (pares YES+NO) o robô pode manter abertas ao mesmo tempo.
                </p>
              </div>

              {/* Limiar do Radar (Observação de Perto) */}
              <div>
                <label
                  htmlFor="min-watch-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Limiar do Radar (ex: 0.90 = 90%)
                </label>
                <input
                  id="min-watch-input"
                  type="number"
                  step="0.01"
                  min="0.50"
                  max="0.95"
                  value={minWatchCertaintyProb}
                  onChange={(e) => setMinWatchCertaintyProb(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Piso de probabilidade para registrar e acompanhar o mercado no radar.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 2: Controles Específicos para 5 Minutos (5m) */}
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />⚡ Mercados de
              5 Minutos (5m)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Certeza Entrada 5m */}
              <div>
                <label
                  htmlFor="min-certainty-5m-input"
                  className="block text-xs font-semibold text-cyan-100"
                >
                  Certeza Mínima Entrada (ex: 0.95 = 95%)
                </label>
                <input
                  id="min-certainty-5m-input"
                  type="number"
                  step="0.01"
                  min="0.50"
                  max="0.99"
                  value={minHighCertaintyProb5m}
                  onChange={(e) => setMinHighCertaintyProb5m(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-cyan-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Gatilho de probabilidade para envio de ordem em mercados de 5m.
                </p>
              </div>

              {/* Janela Entrada Altcoins 5m */}
              <div>
                <label
                  htmlFor="t5m-alt-input"
                  className="block text-xs font-semibold text-cyan-100"
                >
                  Janela Final Altcoins (segundos)
                </label>
                <input
                  id="t5m-alt-input"
                  type="number"
                  min={10}
                  max={300}
                  value={maxEntrySecondsBeforeExpiry5mAlt}
                  onChange={(e) => setMaxEntrySecondsBeforeExpiry5mAlt(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-cyan-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Segundos finais para disparar ordem em SOL, DOGE, XRP (5m).
                </p>
              </div>

              {/* Janela Entrada Majors 5m */}
              <div>
                <label
                  htmlFor="t5m-maj-input"
                  className="block text-xs font-semibold text-cyan-100"
                >
                  Janela Final BTC/ETH (segundos)
                </label>
                <input
                  id="t5m-maj-input"
                  type="number"
                  min={10}
                  max={300}
                  value={maxEntrySecondsBeforeExpiry5mMaj}
                  onChange={(e) => setMaxEntrySecondsBeforeExpiry5mMaj(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-cyan-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Segundos finais para disparar ordem em BTC e ETH (5m).
                </p>
              </div>

              {/* Multiplicador ATR 5m */}
              <div>
                <label
                  htmlFor="atr-mult-5m-input"
                  className="block text-xs font-semibold text-cyan-100"
                >
                  Sensibilidade ATR 5m (Multiplicador)
                </label>
                <input
                  id="atr-mult-5m-input"
                  type="number"
                  step="0.05"
                  min={0.05}
                  max={2.0}
                  value={atrMultiplier5m}
                  onChange={(e) => setAtrMultiplier5m(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-cyan-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-cyan-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Multiplicador sobre ATR 1m para folga dinâmica no 5m. Padrão: 0.25x (antes 0.5x).
                </p>
              </div>
            </div>
          </div>

          {/* Seção 3: Controles Específicos para 15 Minutos (15m) */}
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400" />
              ⏱️ Mercados de 15 Minutos (15m)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Certeza Entrada 15m */}
              <div>
                <label
                  htmlFor="min-certainty-15m-input"
                  className="block text-xs font-semibold text-indigo-100"
                >
                  Certeza Mínima Entrada (ex: 0.91 = 91%)
                </label>
                <input
                  id="min-certainty-15m-input"
                  type="number"
                  step="0.01"
                  min="0.50"
                  max="0.99"
                  value={minHighCertaintyProb15m}
                  onChange={(e) => setMinHighCertaintyProb15m(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Gatilho de probabilidade para envio de ordem em mercados de 15m.
                </p>
              </div>

              {/* Janela Entrada Altcoins 15m */}
              <div>
                <label
                  htmlFor="t15m-alt-input"
                  className="block text-xs font-semibold text-indigo-100"
                >
                  Janela Final Altcoins (segundos)
                </label>
                <input
                  id="t15m-alt-input"
                  type="number"
                  min={10}
                  max={600}
                  value={maxEntrySecondsBeforeExpiry15mAlt}
                  onChange={(e) => setMaxEntrySecondsBeforeExpiry15mAlt(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Segundos finais para disparar ordem em SOL, DOGE, XRP (15m).
                </p>
              </div>

              {/* Janela Entrada Majors 15m */}
              <div>
                <label
                  htmlFor="t15m-maj-input"
                  className="block text-xs font-semibold text-indigo-100"
                >
                  Janela Final BTC/ETH (segundos)
                </label>
                <input
                  id="t15m-maj-input"
                  type="number"
                  min={10}
                  max={600}
                  value={maxEntrySecondsBeforeExpiry15mMaj}
                  onChange={(e) => setMaxEntrySecondsBeforeExpiry15mMaj(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Segundos finais para disparar ordem em BTC e ETH (15m).
                </p>
              </div>

              {/* Multiplicador ATR 15m */}
              <div>
                <label
                  htmlFor="atr-mult-15m-input"
                  className="block text-xs font-semibold text-indigo-100"
                >
                  Sensibilidade ATR 15m (Multiplicador)
                </label>
                <input
                  id="atr-mult-15m-input"
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={3.0}
                  value={atrMultiplier15m}
                  onChange={(e) => setAtrMultiplier15m(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-500/40 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-400"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Multiplicador sobre ATR 1m para folga dinâmica no 15m. Padrão: 0.8x (antes 1.5x).
                </p>
              </div>
            </div>
          </div>

          {/* Seção 4: Proteções, Ponto de Corte (Spot Distance) e IA */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Proteções, Ponto de Corte & IA Gate 4
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Distância Mínima Spot Altcoin */}
              <div>
                <label
                  htmlFor="min-spot-distance-alt-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Ponto de Corte Altcoins (%)
                </label>
                <input
                  id="min-spot-distance-alt-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.0"
                  value={minSpotDistancePctAlt}
                  onChange={(e) => setMinSpotDistancePctAlt(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Distância mínima entre preço spot atual e abertura (SOL, DOGE, XRP).
                </p>
              </div>

              {/* Distância Mínima Spot Majors */}
              <div>
                <label
                  htmlFor="min-spot-distance-maj-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Ponto de Corte BTC/ETH (%)
                </label>
                <input
                  id="min-spot-distance-maj-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.0"
                  value={minSpotDistancePctMaj}
                  onChange={(e) => setMinSpotDistancePctMaj(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Distância mínima entre preço spot atual e abertura (BTC e ETH).
                </p>
              </div>

              {/* Status Dinâmico e Métricas da IA (Meta-Labeling) */}
              <div className="col-span-1 md:col-span-2 rounded-lg border border-purple-500/20 bg-purple-950/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-200">
                      Telemetria Dinâmica da IA (Meta-Labeling)
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      aiStatus?.isTrained
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {aiStatus?.isTrained ? "MODELO TREINADO & ATIVO" : "EM CALIBRAÇÃO"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded bg-black/30 p-2">
                    <span className="block text-[10px] text-slate-400">Acurácia IA</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {aiStatus?.metadata?.accuracy !== undefined
                        ? `${(aiStatus.metadata.accuracy * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="rounded bg-black/30 p-2">
                    <span className="block text-[10px] text-slate-400">Win Rate Base</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {aiStatus?.metadata?.winRateBaseline !== undefined
                        ? `${(aiStatus.metadata.winRateBaseline * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="rounded bg-black/30 p-2">
                    <span className="block text-[10px] text-slate-400">Amostras Dataset</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {aiStatus?.metadata?.samplesCount ?? aiStatus?.totalExecutedTrades ?? 0}
                    </span>
                  </div>
                  <div className="rounded bg-black/30 p-2">
                    <span className="block text-[10px] text-slate-400">Mín. P/ Treino</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {aiStatus?.minTradesRequired ?? 20}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confiança Mínima IA (Gate 4) */}
              <div>
                <label
                  htmlFor="min-ai-confidence-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Confiança Mínima IA Gate 4 (ex: 0.50 = 50%)
                </label>
                <input
                  id="min-ai-confidence-input"
                  type="number"
                  step="0.01"
                  min="0.40"
                  max="0.95"
                  value={minAiConfidence}
                  onChange={(e) => setMinAiConfidence(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Probabilidade mínima exigida pelo Random Forest para aprovar entrada.
                </p>
              </div>

              {/* Emergency Stop Loss */}
              <div>
                <label
                  htmlFor="stop-loss-pct-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Stop Loss Emergência (%)
                </label>
                <input
                  id="stop-loss-pct-input"
                  type="number"
                  step="1"
                  min="5"
                  max="50"
                  value={stopLossPct}
                  onChange={(e) => setStopLossPct(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Encerra imediatamente se a cotação sofrer perda percentual acima deste limite.
                </p>
              </div>

              {/* Lucro Mínimo Saída Antecipada */}
              <div>
                <label
                  htmlFor="min-tp-pct-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Lucro Mínimo Saída Antecipada (%)
                </label>
                <input
                  id="min-tp-pct-input"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20.0"
                  value={minTakeProfitPct}
                  onChange={(e) => setMinTakeProfitPct(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Lucro líquido mínimo para autorizar saída antecipada.
                </p>
              </div>

              {/* Slippage Máximo */}
              <div>
                <label
                  htmlFor="max-slippage-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Slippage Máximo (%)
                </label>
                <input
                  id="max-slippage-input"
                  type="number"
                  step="0.05"
                  value={maxSlippagePct}
                  onChange={(e) => setMaxSlippagePct(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Tolerância máxima de slippage na execução das ordens.
                </p>
              </div>

              {/* Spread Bid×Ask Máximo do Lado */}
              <div>
                <label
                  htmlFor="max-side-spread-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Spread Máx. Bid×Ask do Lado (USD)
                </label>
                <input
                  id="max-side-spread-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.50"
                  value={maxSideSpreadUsd}
                  onChange={(e) => setMaxSideSpreadUsd(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Tolerância de spread interno no book antes de descartar como book fino (Padrão:
                  $0.10).
                </p>
              </div>

              {/* Piso de Kaufman ER */}
              <div>
                <label
                  htmlFor="min-kaufman-er-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Piso Kaufman ER (Gate 2)
                </label>
                <input
                  id="min-kaufman-er-input"
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="0.80"
                  value={minKaufmanEr}
                  onChange={(e) => setMinKaufmanEr(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Eficiência mínima da tendência spot para filtrar Random Walk (Padrão: 0.20).
                </p>
              </div>

              {/* Edge Mínimo Real (%) */}
              <div>
                <label
                  htmlFor="min-edge-pct-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Edge Mínimo Real Gate 1 (%)
                </label>
                <input
                  id="min-edge-pct-input"
                  type="number"
                  step="0.1"
                  min="-10.0"
                  max="10.0"
                  value={minEdgePct}
                  onChange={(e) => setMinEdgePct(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Vantagem percentual mínima exigida líquida de taxas (Padrão: 1.0% | Permite
                  negativo para tokens altos).
                </p>
              </div>

              {/* Peso do Modelo Merton vs Tela */}
              <div>
                <label
                  htmlFor="merton-weight-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Peso do Modelo Merton (0.0 a 1.0)
                </label>
                <input
                  id="merton-weight-input"
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={mertonWeight}
                  onChange={(e) => setMertonWeight(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Ponderação da probabilidade teórica de Merton vs preço de tela (0.0 = 100% Tela).
                </p>
              </div>

              {/* Gatilho de Disparo Antecipado por Alta Convicção (%) */}
              <div>
                <label
                  htmlFor="early-conviction-prob-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Gatilho Convicção Disparo Antecipado (%)
                </label>
                <input
                  id="early-conviction-prob-input"
                  type="number"
                  step="1"
                  min="65"
                  max="99"
                  value={earlyConvictionMinProbPct}
                  onChange={(e) => setEarlyConvictionMinProbPct(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Probabilidade mínima para disparar antes da janela final de 180s quando spread ≤
                  2% (Padrão: 80%).
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-800 pt-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Salvar Alterações
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
