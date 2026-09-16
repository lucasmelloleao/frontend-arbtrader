"use client";

import { useState, useTransition } from "react";

import { ChevronDown, Save, Settings, ShieldCheck } from "lucide-react";

import { salvarSettings } from "@/features/prediction-arb/prediction-arb.actions";
import type { PredictionArbSettings } from "@/features/prediction-arb/prediction-arb.schema";

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
  const [minSpreadPct, setMinSpreadPct] = useState(settings?.minSpreadPct ?? 0.5);
  const [minVolume24hUSD, setMinVolume24hUSD] = useState(settings?.minVolume24hUSD ?? 5000);
  const [maxOpenPairs, setMaxOpenPairs] = useState(settings?.maxOpenPairs ?? 3);
  const [targetProfitPct, setTargetProfitPct] = useState(settings?.targetProfitPct ?? 1.0);
  const [makerOnly, setMakerOnly] = useState(settings?.makerOnly ?? true);
  const [maxSlippagePct, setMaxSlippagePct] = useState(settings?.maxSlippagePct ?? 0.1);
  const [closeWhenComplete, setCloseWhenComplete] = useState(settings?.closeWhenComplete ?? true);
  const [maxDailyLoss, setMaxDailyLoss] = useState(settings?.maxDailyLoss ?? 10);
  const [minHighCertaintyProb, setMinHighCertaintyProb] = useState(
    settings?.minHighCertaintyProb ?? 0.95,
  );
  const [minWatchCertaintyProb, setMinWatchCertaintyProb] = useState(
    settings?.minWatchCertaintyProb ?? 0.9,
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setMensagem(null);

    startTransition(async () => {
      const res = await salvarSettings({
        isScanningEnabled,
        tradeSize,
        minSpreadPct,
        minVolume24hUSD,
        maxOpenPairs,
        targetProfitPct,
        makerOnly,
        maxSlippagePct,
        closeWhenComplete,
        maxDailyLoss,
        minHighCertaintyProb,
        minWatchCertaintyProb,
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Habilitar Scanner */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div>
                <label
                  htmlFor="scan-enabled"
                  className="cursor-pointer text-xs font-semibold text-white"
                >
                  Auto-Scanner Ativo
                </label>
                <p className="text-[10px] text-slate-400">Monitorar Gamma API por oportunidades</p>
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
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Spread Mínimo */}
            <div>
              <label
                htmlFor="min-spread-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Spread Mínimo (%)
              </label>
              <input
                id="min-spread-input"
                type="number"
                step="0.1"
                value={minSpreadPct}
                onChange={(e) => setMinSpreadPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Volume Mínimo 24h */}
            <div>
              <label htmlFor="min-vol-input" className="block text-xs font-semibold text-slate-300">
                Volume Mínimo 24h (USD)
              </label>
              <input
                id="min-vol-input"
                type="number"
                value={minVolume24hUSD}
                onChange={(e) => setMinVolume24hUSD(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
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
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
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
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Quantas posições (pares YES+NO) o robô pode manter abertas ao mesmo tempo.
              </p>
            </div>

            {/* Target Profit % */}
            <div>
              <label
                htmlFor="target-profit-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Meta de Lucro (%)
              </label>
              <input
                id="target-profit-input"
                type="number"
                step="0.1"
                value={targetProfitPct}
                onChange={(e) => setTargetProfitPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Certeza Mínima Direcional (Entrada) */}
            <div>
              <label
                htmlFor="min-certainty-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Certeza Entrada Direcional (ex: 0.95 = 95%)
              </label>
              <input
                id="min-certainty-input"
                type="number"
                step="0.01"
                min="0.50"
                max="0.99"
                value={minHighCertaintyProb}
                onChange={(e) => setMinHighCertaintyProb(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Gatilho para envio efetivo da ordem na Polymarket.
              </p>
            </div>

            {/* Limiar do Radar (Observação de Perto) */}
            <div>
              <label
                htmlFor="min-watch-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Limiar Radar / Observação (ex: 0.90 = 90%)
              </label>
              <input
                id="min-watch-input"
                type="number"
                step="0.01"
                min="0.50"
                max="0.98"
                value={minWatchCertaintyProb}
                onChange={(e) => setMinWatchCertaintyProb(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Entra no radar de alta prioridade sem enviar ordem até atingir a certeza de entrada.
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
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={makerOnly}
                  onChange={(e) => setMakerOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                Maker Only (Evitar Taker Fees)
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={closeWhenComplete}
                  onChange={(e) => setCloseWhenComplete(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                Fechar ao Alcançar Completude (1.00)
              </label>
            </div>

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
