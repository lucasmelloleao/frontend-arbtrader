"use client";

import { useState, useTransition } from "react";
import { X, Save } from "lucide-react";
import { atualizarEstrategiaFxPro } from "@/features/fxpro/fxpro.actions";
import type { FxProStrategy } from "@/features/fxpro/fxpro.schema";

type FxProStrategyModalProps = {
  strategy: FxProStrategy;
  onFechar: () => void;
};

export function FxProStrategyModal({
  strategy,
  onFechar,
}: FxProStrategyModalProps): React.ReactNode {
  const [isPending, startTransition] = useTransition();
  const [nome, setNome] = useState(strategy.name);
  const [lotSize, setLotSize] = useState(strategy.lotSize);
  const leverage = strategy.leverage;
  const [timeframe, setTimeframe] = useState(strategy.timeframe);
  const [takeProfitPips, setTakeProfitPips] = useState(strategy.takeProfitPips);
  const [stopLossPips, setStopLossPips] = useState(strategy.stopLossPips);
  const [trailingStopPips, setTrailingStopPips] = useState(strategy.trailingStopPips);
  const [minVarianceRatio, setMinVarianceRatio] = useState(strategy.minVarianceRatio);
  const minEfficiencyRatio = strategy.minEfficiencyRatio;
  const maxSpreadPips = strategy.maxSpreadPips;
  const [useAiMetaLabeling, setUseAiMetaLabeling] = useState(strategy.useAiMetaLabeling);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const stratId = strategy.id || strategy._id || "";
      const res = await atualizarEstrategiaFxPro(stratId, {
        name: nome,
        symbol: strategy.symbol,
        timeframe,
        lotSize,
        leverage,
        takeProfitPips,
        stopLossPips,
        trailingStopPips,
        minVarianceRatio,
        minEfficiencyRatio,
        maxSpreadPips,
        useAiMetaLabeling,
      });

      if (res.ok) {
        onFechar();
      } else {
        setErro(res.erro);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Configurar Ativo {strategy.symbol}</h3>
            <p className="text-xs text-slate-400">Ajuste os parâmetros exclusivos para este par</p>
          </div>
          <button type="button" onClick={onFechar} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {erro && (
          <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="modal-nome" className="text-xs font-semibold text-slate-300">
                Nome da Estratégia
              </label>
              <input
                id="modal-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="modal-timeframe" className="text-xs font-semibold text-slate-300">
                Timeframe
              </label>
              <select
                id="modal-timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="1m">1 Minuto (M1)</option>
                <option value="5m">5 Minutos (M5)</option>
                <option value="15m">15 Minutos (M15)</option>
                <option value="1h">1 Hora (H1)</option>
              </select>
            </div>

            <div>
              <label htmlFor="modal-lote" className="text-xs font-semibold text-slate-300">
                Lote por Operação
              </label>
              <input
                id="modal-lote"
                type="number"
                step="0.01"
                min="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="modal-tp" className="text-xs font-semibold text-slate-300">
                Take Profit (Pips)
              </label>
              <input
                id="modal-tp"
                type="number"
                value={takeProfitPips}
                onChange={(e) => setTakeProfitPips(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="modal-sl" className="text-xs font-semibold text-slate-300">
                Stop Loss (Pips)
              </label>
              <input
                id="modal-sl"
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="modal-trailing" className="text-xs font-semibold text-slate-300">
                Trailing Stop (Pips)
              </label>
              <input
                id="modal-trailing"
                type="number"
                value={trailingStopPips}
                onChange={(e) => setTrailingStopPips(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="modal-vr" className="text-xs font-semibold text-slate-300">
                Random Walk (VR Mínimo)
              </label>
              <input
                id="modal-vr"
                type="number"
                step="0.01"
                value={minVarianceRatio}
                onChange={(e) => setMinVarianceRatio(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-900/60 p-3">
            <input
              type="checkbox"
              id="modalUseAi"
              checked={useAiMetaLabeling}
              onChange={(e) => setUseAiMetaLabeling(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="modalUseAi" className="text-xs text-slate-300 cursor-pointer">
              Ativar <strong>Gate 4 (IA Meta-Labeling)</strong> para este par
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
