"use client";

import { useState, useTransition } from "react";

import { Plus, X } from "lucide-react";

import { criarStrategy } from "@/features/prediction-arb/prediction-arb.actions";

type PredictionStrategyFormProps = {
  exchangeKeys: readonly { id: string; exchangeId: string; nome: string }[];
  onFechar: () => void;
};

/**
 * Form modal/inline para adicionar uma estratégia por slug de mercado na Gamma API.
 */
export function PredictionStrategyForm({
  exchangeKeys,
  onFechar,
}: PredictionStrategyFormProps): React.ReactNode {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [tradeSize, setTradeSize] = useState(100);
  const [autoExecute, setAutoExecute] = useState(false);
  const [exchangeKeyId, setExchangeKeyId] = useState(exchangeKeys[0]?.id ?? "");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!slug.trim()) {
      setErro("Informe o slug do mercado Polymarket.");
      return;
    }
    setErro(null);

    startTransition(async () => {
      const res = await criarStrategy({
        slug: slug.trim(),
        tradeSize,
        autoExecute,
        exchangeKeyId: exchangeKeyId || undefined,
      });

      if (res.ok) {
        onFechar();
      } else {
        setErro(res.erro);
      }
    });
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950 p-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Plus className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          Criar Estratégia (Polymarket)
        </h3>
        <button
          type="button"
          onClick={onFechar}
          className="text-slate-400 transition-colors hover:text-white"
          aria-label="Fechar formulário"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {erro !== null ? (
          <div className="rounded-lg bg-rose-500/15 p-3 text-xs font-semibold text-rose-300">
            {erro}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="slug-input" className="block text-xs font-semibold text-slate-300">
              Slug do Mercado (Gamma API)
            </label>
            <input
              id="slug-input"
              type="text"
              placeholder="ex: fed-rate-cut-september-2026"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="trade-size-strategy"
              className="block text-xs font-semibold text-slate-300"
            >
              Aporte Inicial (USDT)
            </label>
            <input
              id="trade-size-strategy"
              type="number"
              min={1}
              value={tradeSize}
              onChange={(e) => setTradeSize(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="exchange-key-select"
              className="block text-xs font-semibold text-slate-300"
            >
              Chave de API / Carteira
            </label>
            <select
              id="exchange-key-select"
              value={exchangeKeyId}
              onChange={(e) => setExchangeKeyId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {exchangeKeys.length === 0 ? (
                <option value="">Nenhuma chave cadastrada</option>
              ) : (
                exchangeKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nome} ({k.exchangeId})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            Executar Automaticamente ao Detectar Spread Mínimo
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              Criar Estratégia
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
