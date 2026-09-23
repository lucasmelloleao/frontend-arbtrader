"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Save, Settings, ShieldCheck, Power } from "lucide-react";
import { salvarFxProSettings } from "@/features/fxpro/fxpro.actions";
import type { FxProSettings } from "@/features/fxpro/fxpro.schema";

type FxProSettingsPanelProps = {
  settings: FxProSettings | null;
};

export function FxProSettingsPanel({ settings }: FxProSettingsPanelProps): React.ReactNode {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [accountType, setAccountType] = useState(settings?.accountType ?? "demo");
  const [accountId, setAccountId] = useState(settings?.accountId ?? "10650441");
  const [isScanningEnabled, setIsScanningEnabled] = useState(settings?.isScanningEnabled ?? false);
  const [allowLiveTrading, setAllowLiveTrading] = useState(settings?.allowLiveTrading ?? false);
  const [maxOpenPositions, setMaxOpenPositions] = useState(settings?.maxOpenPositions ?? 3);
  const [maxDailyLoss, setMaxDailyLoss] = useState(settings?.maxDailyLoss ?? 50);
  const [maxDailyProfit, setMaxDailyProfit] = useState(settings?.maxDailyProfit ?? 100);
  const [defaultLotSize, setDefaultLotSize] = useState(settings?.defaultLotSize ?? 0.01);
  const [defaultLeverage, setDefaultLeverage] = useState(settings?.defaultLeverage ?? 1000);
  const [globalTrailingStop, setGlobalTrailingStop] = useState(settings?.globalTrailingStop ?? true);
  const [useAiMetaLabeling, setUseAiMetaLabeling] = useState(settings?.useAiMetaLabeling ?? true);
  const [minAiConfidence, setMinAiConfidence] = useState(
    Math.round((settings?.minAiConfidence ?? 0.55) * 100)
  );
  const [allowedSymbolsStr, setAllowedSymbolsStr] = useState(
    (settings?.allowedSymbols ?? ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"]).join(", ")
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setMensagem(null);

    startTransition(async () => {
      const symbolsArray = allowedSymbolsStr
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const res = await salvarFxProSettings({
        accountType,
        accountId,
        isScanningEnabled,
        allowLiveTrading,
        maxOpenPositions: Number(maxOpenPositions),
        maxDailyLoss: Number(maxDailyLoss),
        maxDailyProfit: Number(maxDailyProfit),
        defaultLotSize: Number(defaultLotSize),
        defaultLeverage: Number(defaultLeverage),
        globalTrailingStop,
        useAiMetaLabeling,
        minAiConfidence: Number((minAiConfidence / 100).toFixed(2)),
        allowedSymbols: symbolsArray,
      });

      if (res.ok) {
        setMensagem({ tipo: "ok", texto: "Configurações da FxPro cTrader salvas com sucesso!" });
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
        <div className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <span>Configurações Globais do Robô FxPro (cTrader Open API)</span>
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isScanningEnabled
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {isScanningEnabled ? "Robô Ligado (Ativo)" : "Robô Pausado"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {mensagem !== null && (
            <div
              className={`rounded-lg p-3 text-xs font-semibold ${
                mensagem.tipo === "ok"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Tipo de Conta cTrader</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as "demo" | "real")}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="demo">Demo (Hedging)</option>
                <option value="real">Real / Live (Hedging)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Número da Conta</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Ex: 10650441"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Max Posições Globais</label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxOpenPositions}
                onChange={(e) => setMaxOpenPositions(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Alavancagem Padrão</label>
              <input
                type="number"
                value={defaultLeverage}
                onChange={(e) => setDefaultLeverage(Number(e.target.value))}
                placeholder="Ex: 1000"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Stop Loss Diário ($)</label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Meta Diária de Lucro ($)</label>
              <input
                type="number"
                value={maxDailyProfit}
                onChange={(e) => setMaxDailyProfit(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Lote Padrão</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={defaultLotSize}
                onChange={(e) => setDefaultLotSize(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Confiança Mínima da IA (%)</label>
              <input
                type="number"
                min="50"
                max="95"
                value={minAiConfidence}
                onChange={(e) => setMinAiConfidence(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">
              Pares Autorizados para Monitoramento Automático
            </label>
            <input
              type="text"
              value={allowedSymbolsStr}
              onChange={(e) => setAllowedSymbolsStr(e.target.value)}
              placeholder="EURUSD, GBPUSD, USDJPY, XAUUSD, BTCUSD"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Switches de Controle */}
          <div className="grid gap-3 sm:grid-cols-3 border-t border-white/5 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isScanningEnabled}
                onChange={(e) => setIsScanningEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Ativar Motor Contínuo (Scan MKT)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={allowLiveTrading}
                onChange={(e) => setAllowLiveTrading(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Permitir Envio Real de Ordens</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={useAiMetaLabeling}
                onChange={(e) => setUseAiMetaLabeling(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Ativar Gate 4 (IA Meta-Labeling)</span>
            </label>
          </div>

          <div className="flex justify-end border-t border-white/10 pt-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {isPending ? "Salvando..." : "Salvar Configurações Globais"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
