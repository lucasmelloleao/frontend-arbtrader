"use client";

import { useState, useTransition } from "react";
import { X, Play } from "lucide-react";
import { criarEstrategiaFxPro } from "@/features/fxpro/fxpro.actions";
import type { FxProStrategy } from "@/features/fxpro/fxpro.schema";

type FxProStrategyFormProps = {
  exchangeKeys?: readonly { id: string; exchangeId: string; nome: string }[];
  onFechar: () => void;
};

const PARES_FOREX = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDCHF",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  "XAUUSD",
  "BTCUSD",
];

export function FxProStrategyForm({
  exchangeKeys = [],
  onFechar,
}: FxProStrategyFormProps): React.ReactNode {
  const [isPending, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [symbol, setSymbol] = useState("EURUSD");
  const [exchangeKeyId, setExchangeKeyId] = useState(exchangeKeys[0]?.id || "");
  const [timeframe, setTimeframe] = useState("5m");
  const [lotSize, setLotSize] = useState(0.01);
  const [leverage, setLeverage] = useState(1000);
  const [takeProfitPips, setTakeProfitPips] = useState(20);
  const [stopLossPips, setStopLossPips] = useState(15);
  const [trailingStopPips, setTrailingStopPips] = useState(10);
  const [minVarianceRatio, setMinVarianceRatio] = useState(1.08);
  const [minEfficiencyRatio, setMinEfficiencyRatio] = useState(0.35);
  const [maxSpreadPips, setMaxSpreadPips] = useState(2.5);
  const [useAiMetaLabeling, setUseAiMetaLabeling] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErro(null);

    const dados: Partial<FxProStrategy> = {
      name: nome.trim() || `Robô FxPro ${symbol}`,
      symbol,
      timeframe,
      lotSize: Number(lotSize),
      leverage: Number(leverage),
      takeProfitPips: Number(takeProfitPips),
      stopLossPips: Number(stopLossPips),
      trailingStopPips: Number(trailingStopPips),
      minVarianceRatio: Number(minVarianceRatio),
      minEfficiencyRatio: Number(minEfficiencyRatio),
      maxSpreadPips: Number(maxSpreadPips),
      useAiMetaLabeling,
    };

    startTransition(async () => {
      const res = await criarEstrategiaFxPro(dados);
      if (res.ok) {
        onFechar();
      } else {
        setErro(res.erro);
      }
    });
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950/90 p-5 shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-bold text-white">Criar Nova Estratégia FxPro cTrader</h3>
        <button
          type="button"
          onClick={onFechar}
          className="text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">
              Nome da Estratégia
            </label>
            <input
              type="text"
              placeholder={`Ex: Scalper ${symbol}`}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Par Forex / CFD</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {PARES_FOREX.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Timeframe</label>
            <select
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
            <label className="text-[11px] font-bold text-slate-300 uppercase">Lote Inicial</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Take Profit (Pips)</label>
            <input
              type="number"
              value={takeProfitPips}
              onChange={(e) => setTakeProfitPips(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Stop Loss (Pips)</label>
            <input
              type="number"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Trailing Stop (Pips)</label>
            <input
              type="number"
              value={trailingStopPips}
              onChange={(e) => setTrailingStopPips(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Filtro Random Walk (VR)</label>
            <input
              type="number"
              step="0.01"
              value={minVarianceRatio}
              onChange={(e) => setMinVarianceRatio(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Max Spread (Pips)</label>
            <input
              type="number"
              step="0.1"
              value={maxSpreadPips}
              onChange={(e) => setMaxSpreadPips(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3">
          <input
            type="checkbox"
            id="useAiMetaLabeling"
            checked={useAiMetaLabeling}
            onChange={(e) => setUseAiMetaLabeling(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="useAiMetaLabeling" className="text-xs text-slate-300 cursor-pointer">
            Ativar <strong>Gate 4 (IA Meta-Labeling Random Forest)</strong> para validação de
            probabilidade de vitória (P(Win) &ge; 55%).
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
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
            <Play className="h-3.5 w-3.5" />
            {isPending ? "Criando..." : "Criar e Iniciar"}
          </button>
        </div>
      </form>
    </div>
  );
}
