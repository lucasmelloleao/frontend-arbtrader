"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import {
  criarEstrategiaIcMarkets,
  atualizarEstrategiaIcMarkets,
} from "@/features/icmarkets/icmarkets.actions";
import type { IcMarketsStrategy } from "@/features/icmarkets/icmarkets.schema";

type IcMarketsStrategyModalProps = {
  strategy: IcMarketsStrategy | null;
  onClose: () => void;
};

export function IcMarketsStrategyModal({
  strategy,
  onClose,
}: IcMarketsStrategyModalProps): React.ReactNode {
  const isEditing = Boolean(strategy && strategy.id);

  const [form, setForm] = useState<Partial<IcMarketsStrategy>>(
    strategy || {
      name: "Scalping IC Raw EURUSD",
      symbol: "EURUSD",
      timeframe: "1m",
      lotSize: 0.01,
      leverage: 500,
      takeProfitPips: 20,
      stopLossPips: 15,
      trailingStopPips: 10,
      trailingStepPips: 5,
      maxSpreadPips: 2.5,
      minVarianceRatio: 1.08,
      minEfficiencyRatio: 0.35,
      useAiMetaLabeling: true,
      minAiConfidence: 0.55,
      active: true,
    },
  );

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    let res;
    if (isEditing && strategy?.id) {
      res = await atualizarEstrategiaIcMarkets(strategy.id, form);
    } else {
      res = await criarEstrategiaIcMarkets(form);
    }

    if (res.ok) {
      onClose();
    } else {
      setErro(res.erro);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">
            {isEditing ? "Editar Estratégia IC Markets" : "Nova Estratégia IC Markets cTrader"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {erro && (
          <div className="mt-3 rounded border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-400">
            {erro}
          </div>
        )}

        <form onSubmit={salvar} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-xs font-semibold text-slate-300"
                htmlFor="ic-strategy-name"
              >
                Nome da Estratégia
              </label>
              <input
                id="ic-strategy-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold text-slate-300"
                htmlFor="ic-strategy-symbol"
              >
                Símbolo (Par Forex)
              </label>
              <select
                id="ic-strategy-symbol"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
              >
                <option value="EURUSD">EURUSD (Euro / Dólar)</option>
                <option value="GBPUSD">GBPUSD (Libra / Dólar)</option>
                <option value="USDJPY">USDJPY (Dólar / Iene)</option>
                <option value="XAUUSD">XAUUSD (Ouro Spot)</option>
                <option value="BTCUSD">BTCUSD (Bitcoin / Dólar)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="ic-strategy-lot">
                Lote (Volume)
              </label>
              <input
                id="ic-strategy-lot"
                type="number"
                step="0.01"
                min="0.01"
                value={form.lotSize}
                onChange={(e) => setForm({ ...form, lotSize: Number(e.target.value) })}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-emerald-400 font-semibold"
                htmlFor="ic-strategy-tp"
              >
                Take Profit (Pips)
              </label>
              <input
                id="ic-strategy-tp"
                type="number"
                value={form.takeProfitPips}
                onChange={(e) => setForm({ ...form, takeProfitPips: Number(e.target.value) })}
                className="w-full rounded border border-emerald-500/30 bg-slate-900 px-2 py-1.5 text-xs text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-rose-400 font-semibold"
                htmlFor="ic-strategy-sl"
              >
                Stop Loss (Pips)
              </label>
              <input
                id="ic-strategy-sl"
                type="number"
                value={form.stopLossPips}
                onChange={(e) => setForm({ ...form, stopLossPips: Number(e.target.value) })}
                className="w-full rounded border border-rose-500/30 bg-slate-900 px-2 py-1.5 text-xs text-rose-400 font-bold"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-cyan-400" htmlFor="ic-strategy-trailing">
                Trailing Stop (Pips)
              </label>
              <input
                id="ic-strategy-trailing"
                type="number"
                value={form.trailingStopPips}
                onChange={(e) => setForm({ ...form, trailingStopPips: Number(e.target.value) })}
                className="w-full rounded border border-cyan-500/30 bg-slate-900 px-2 py-1.5 text-xs text-cyan-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="ic-strategy-spread">
                Spread Máx (Pips)
              </label>
              <input
                id="ic-strategy-spread"
                type="number"
                step="0.1"
                value={form.maxSpreadPips}
                onChange={(e) => setForm({ ...form, maxSpreadPips: Number(e.target.value) })}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Filtros Quantitativos e IA Meta-Labeling */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-purple-400">
              ⚡ Filtros dos 4 Gates (Calibração Quantitativa & IA)
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300" htmlFor="ic-min-er">
                  Gate 1: Min Efficiency Ratio (ER)
                </label>
                <input
                  id="ic-min-er"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.0"
                  value={form.minEfficiencyRatio}
                  onChange={(e) => setForm({ ...form, minEfficiencyRatio: Number(e.target.value) })}
                  className="w-full rounded border border-purple-500/30 bg-slate-900 px-2 py-1.5 text-xs text-white"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Kaufman ER (0.10 a 0.35). Menor valor abre mais ordens.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300" htmlFor="ic-min-vr">
                  Gate 2: Min Variance Ratio (VR)
                </label>
                <input
                  id="ic-min-vr"
                  type="number"
                  step="0.01"
                  min="0.90"
                  max="2.0"
                  value={form.minVarianceRatio}
                  onChange={(e) => setForm({ ...form, minVarianceRatio: Number(e.target.value) })}
                  className="w-full rounded border border-purple-500/30 bg-slate-900 px-2 py-1.5 text-xs text-white"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Lo-MacKinlay VR (1.00 a 1.08). 1.00 aceita ruído de mercado.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-purple-500/20">
              <div className="flex items-center gap-2">
                <input
                  id="ic-use-ai"
                  type="checkbox"
                  checked={form.useAiMetaLabeling}
                  onChange={(e) => setForm({ ...form, useAiMetaLabeling: e.target.checked })}
                  className="h-4 w-4 rounded border-purple-500/30 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="ic-use-ai" className="text-xs font-semibold text-purple-300">
                  Gate 4: IA Meta-Labeler (Random Forest)
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300" htmlFor="ic-ai-conf">
                  Confiança Mínima da IA (0 a 1)
                </label>
                <input
                  id="ic-ai-conf"
                  type="number"
                  step="0.05"
                  min="0.50"
                  max="0.95"
                  value={form.minAiConfidence}
                  onChange={(e) => setForm({ ...form, minAiConfidence: Number(e.target.value) })}
                  className="w-full rounded border border-purple-500/30 bg-slate-900 px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <Save className="h-3.5 w-3.5" />{" "}
              {isEditing ? "Salvar Alterações" : "Criar Estratégia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
