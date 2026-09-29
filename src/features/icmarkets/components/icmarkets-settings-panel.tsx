"use client";

import { useState, useTransition } from "react";
import { Save, Wallet, ShieldAlert, Cpu } from "lucide-react";
import {
  alternarRoboIcMarkets,
  salvarConfiguracoesIcMarkets,
} from "@/features/icmarkets/icmarkets.actions";
import type { IcMarketsSettings } from "@/features/icmarkets/icmarkets.schema";

type IcMarketsSettingsPanelProps = {
  settings: IcMarketsSettings | null;
};

export function IcMarketsSettingsPanel({ settings }: IcMarketsSettingsPanelProps): React.ReactNode {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [prevSettings, setPrevSettings] = useState(settings);
  const [form, setForm] = useState<IcMarketsSettings>(
    settings || {
      accountType: "demo",
      accountId: "10117517",
      isScanningEnabled: false,
      allowLiveTrading: false,
      maxOpenPositions: 3,
      maxDailyLoss: 50,
      maxDailyProfit: 100,
      defaultLotSize: 0.01,
      defaultLeverage: 500,
      globalTrailingStop: true,
      useAiMetaLabeling: true,
      minAiConfidence: 0.55,
      allowedSymbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"],
    },
  );

  if (settings && settings !== prevSettings) {
    setPrevSettings(settings);
    setForm(settings);
  }

  const salvar = (): void => {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const res = await salvarConfiguracoesIcMarkets(form);
      if (res.ok) {
        setSucesso("Configurações do robô IC Markets salvas com sucesso!");
        setEditando(false);
      } else {
        setErro(res.erro);
      }
    });
  };

  const alternarRobo = (ligar: boolean): void => {
    setErro(null);
    startTransition(async () => {
      const res = await alternarRoboIcMarkets(ligar);
      if (!res.ok) {
        setErro(res.erro);
      }
    });
  };

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-slate-950/70 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Configurações do Robô IC Markets cTrader
            </h3>
            <p className="text-xs text-slate-400">
              Conta:{" "}
              <b className={form.accountType === "live" ? "text-rose-400" : "text-emerald-400"}>
                {form.accountType.toUpperCase()}
              </b>{" "}
              {form.accountId ? `(#${form.accountId})` : ""} | Lote Base:{" "}
              <b className="text-white">{form.defaultLotSize}</b> | Max Posições:{" "}
              <b className="text-white">{form.maxOpenPositions}</b>
            </p>
          </div>
        </div>
        <div>
          {!editando ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alternarRobo(!form.isScanningEnabled)}
                disabled={isPending}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                  form.isScanningEnabled
                    ? "bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white"
                    : "bg-emerald-600 text-slate-950 hover:bg-emerald-500"
                }`}
              >
                {form.isScanningEnabled ? "⏸ Pausar Robô" : "▶ Ligar Robô"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-2 text-xs font-bold text-indigo-300 transition-colors hover:bg-indigo-600 hover:text-white"
              >
                ⚙️ Ajustar Configurações
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                <Save className="h-3.5 w-3.5" /> Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          {sucesso}
        </div>
      )}

      {editando && (
        <div className="mt-4 space-y-4 border-t border-slate-800/80 pt-4">
          {/* Identificação de Conta IC Markets cTrader */}
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-400">
              🔌 Conexão cTrader IC Markets (ic.com)
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-slate-300"
                  htmlFor="ic-account-type"
                >
                  Tipo de Conta
                </label>
                <select
                  id="ic-account-type"
                  value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                  className="w-full rounded border border-indigo-500/30 bg-slate-900 px-2 py-1.5 text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                >
                  <option value="demo">🟢 Demo (Simulação / Testes)</option>
                  <option value="real">🔴 Live (Conta Real / Produção)</option>
                </select>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-slate-300"
                  htmlFor="ic-account-id"
                >
                  Número da Conta cTrader (Account ID)
                </label>
                <input
                  id="ic-account-id"
                  type="text"
                  placeholder="Ex: 10102182"
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  className="w-full rounded border border-indigo-500/30 bg-slate-900 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Gestão de Risco e Execução */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="ic-lot-size">
                Lote Padrão
              </label>
              <input
                id="ic-lot-size"
                type="number"
                step="0.01"
                min="0.01"
                value={form.defaultLotSize}
                onChange={(e) => setForm({ ...form, defaultLotSize: Number(e.target.value) })}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="ic-max-positions">
                Máx. Posições Abertas
              </label>
              <input
                id="ic-max-positions"
                type="number"
                min="1"
                max="20"
                value={form.maxOpenPositions}
                onChange={(e) => setForm({ ...form, maxOpenPositions: Number(e.target.value) })}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-rose-400 font-semibold"
                htmlFor="ic-daily-loss"
              >
                Perda Máx. Diária ($ USD)
              </label>
              <input
                id="ic-daily-loss"
                type="number"
                min="1"
                value={form.maxDailyLoss}
                onChange={(e) => setForm({ ...form, maxDailyLoss: Number(e.target.value) })}
                className="w-full rounded border border-rose-500/30 bg-slate-900 px-2 py-1 text-xs text-rose-400 font-bold"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-emerald-400 font-semibold"
                htmlFor="ic-daily-profit"
              >
                Meta Diária de Lucro ($ USD)
              </label>
              <input
                id="ic-daily-profit"
                type="number"
                min="1"
                value={form.maxDailyProfit}
                onChange={(e) => setForm({ ...form, maxDailyProfit: Number(e.target.value) })}
                className="w-full rounded border border-emerald-500/30 bg-slate-900 px-2 py-1 text-xs text-emerald-400 font-bold"
              />
            </div>
          </div>

          {/* Gate 4 IA Meta-Labeler */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Cpu className="h-4 w-4" /> Gate 4: IA Meta-Labeling (Random Forest)
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-purple-300">
                <input
                  type="checkbox"
                  checked={form.useAiMetaLabeling}
                  onChange={(e) => setForm({ ...form, useAiMetaLabeling: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                />
                Ativar Filtro de IA
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400" htmlFor="ic-ai-confidence">
                  Limiar de Confiança Mínimo (%)
                </label>
                <input
                  id="ic-ai-confidence"
                  type="number"
                  step="0.01"
                  min="0.50"
                  max="0.95"
                  value={form.minAiConfidence}
                  onChange={(e) => setForm({ ...form, minAiConfidence: Number(e.target.value) })}
                  className="w-full rounded border border-purple-500/30 bg-slate-900 px-2 py-1 text-xs text-purple-300 font-bold"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldAlert className="h-4 w-4 text-purple-400" />
                Veta automaticamente sinais quantitativos quando a probabilidade predita de lucro
                for inferior ao limiar.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
