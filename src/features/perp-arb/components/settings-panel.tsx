"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Shield } from "lucide-react";

import { atualizarSettings } from "@/features/perp-arb/perp-arb.actions";
import type { PerpArbSettings } from "@/features/perp-arb/perp-arb.schema";

type SettingsPanelProps = {
  settings: PerpArbSettings;
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white outline-none focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-xs text-slate-500";

/**
 * Painel de configurações do robô: resumo e edição inline dos parâmetros. A
 * mutação é a Server Action `atualizarSettings` + `router.refresh`. O botão de
 * colheita fica no cabeçalho da página (`HeaderOperacoes`).
 */
export function SettingsPanel({ settings }: SettingsPanelProps): React.ReactNode {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    isScanningEnabled: settings.isScanningEnabled,
    tradeSize: settings.tradeSize,
    minFundingRatePct: settings.minFundingRatePct,
    minVolume24hUSD: settings.minVolume24hUSD,
    maxDailyLoss: settings.maxDailyLoss,
    maxPortfolioCapUSD: settings.maxPortfolioCapUSD,
    maxSlippagePct: settings.maxSlippagePct,
    closeWhileFundingPositive: settings.closeWhileFundingPositive,
    spreadCloseThresholdPct: settings.spreadCloseThresholdPct,
    spreadCloseForcePct: settings.spreadCloseForcePct,
    targetProfitPct: settings.targetProfitPct,
    profitTrailingDropPct: settings.profitTrailingDropPct,
  });

  const atualizar = (campo: keyof typeof form, valor: string | boolean | number): void => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const salvar = async (): Promise<void> => {
    setEnviando(true);
    const resultado = await atualizarSettings(form);
    setEnviando(false);
    if (resultado.ok) {
      setIsEditing(false);
      router.refresh();
    }
  };

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-slate-900/80 p-4 shadow-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
              Configurações do Robô
            </h2>
            <p className="text-xs text-slate-400">
              Aporte: <b className="text-white">${settings.tradeSize}</b> | Funding Mín.:{" "}
              <b className="text-white">{settings.minFundingRatePct}%</b> | Cap:{" "}
              <b className="text-indigo-300">${settings.maxPortfolioCapUSD}</b>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isOpen ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-600 hover:text-white"
            >
              ⚙️ Ajustar Configurações
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsEditing(false);
              }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-400 transition-all hover:text-white"
            >
              Fechar ✕
            </button>
          )}
        </div>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 text-sm sm:grid-cols-8">
          <div>
            <span className="mb-1 block text-xs text-slate-500">Colheita Automática</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold ${
                settings.isScanningEnabled
                  ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${settings.isScanningEnabled ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`}
              />
              {settings.isScanningEnabled ? "Ativa" : "Pausada"}
            </span>
          </div>

          <div>
            <label htmlFor="settings-trade-size" className={ROTULO_CLASS}>
              Aporte p/ Moeda (USDT)
            </label>
            {!isEditing ? (
              <span className="font-bold text-white">${settings.tradeSize}</span>
            ) : (
              <input
                id="settings-trade-size"
                type="number"
                value={form.tradeSize}
                onChange={(e) => atualizar("tradeSize", Number(e.target.value))}
                className={CAMPO_CLASS}
              />
            )}
          </div>

          <div>
            <label htmlFor="settings-min-funding" className={ROTULO_CLASS}>
              Funding Mínimo (%)
            </label>
            {!isEditing ? (
              <span className="font-bold text-white">{settings.minFundingRatePct}%</span>
            ) : (
              <input
                id="settings-min-funding"
                type="number"
                step="0.001"
                value={form.minFundingRatePct}
                onChange={(e) => atualizar("minFundingRatePct", Number(e.target.value))}
                className={CAMPO_CLASS}
              />
            )}
          </div>

          <div>
            <label htmlFor="settings-min-volume" className={ROTULO_CLASS}>
              Vol 24h Mínimo (USDT)
            </label>
            {!isEditing ? (
              <span className="font-bold text-white">
                ${settings.minVolume24hUSD.toLocaleString()}
              </span>
            ) : (
              <input
                id="settings-min-volume"
                type="number"
                value={form.minVolume24hUSD}
                onChange={(e) => atualizar("minVolume24hUSD", Number(e.target.value))}
                className={CAMPO_CLASS}
              />
            )}
          </div>

          <div>
            <label htmlFor="settings-slippage" className={ROTULO_CLASS}>
              Max Slippage (%)
            </label>
            {!isEditing ? (
              <span className="font-bold text-white">{settings.maxSlippagePct}%</span>
            ) : (
              <input
                id="settings-slippage"
                type="number"
                step="0.01"
                value={form.maxSlippagePct}
                onChange={(e) => atualizar("maxSlippagePct", Number(e.target.value))}
                className={CAMPO_CLASS}
              />
            )}
          </div>

          <div>
            <label htmlFor="settings-max-loss" className={ROTULO_CLASS}>
              Max Perda Diária (USDT)
            </label>
            {!isEditing ? (
              <span className="font-bold text-white">${settings.maxDailyLoss}</span>
            ) : (
              <input
                id="settings-max-loss"
                type="number"
                value={form.maxDailyLoss}
                onChange={(e) => atualizar("maxDailyLoss", Number(e.target.value))}
                className={CAMPO_CLASS}
              />
            )}
          </div>

          <div>
            <label htmlFor="settings-cap" className={ROTULO_CLASS}>
              Limite Máx Carteira (USDT)
            </label>
            {!isEditing ? (
              <span className="font-bold text-indigo-300">${settings.maxPortfolioCapUSD}</span>
            ) : (
              <input
                id="settings-cap"
                type="number"
                value={form.maxPortfolioCapUSD}
                onChange={(e) => atualizar("maxPortfolioCapUSD", Number(e.target.value))}
                className={CAMPO_CLASS}
              />
            )}
          </div>

          <div>
            <span className="mb-1 block text-xs text-slate-500">Ações</span>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    isScanningEnabled: settings.isScanningEnabled,
                    tradeSize: settings.tradeSize,
                    minFundingRatePct: settings.minFundingRatePct,
                    minVolume24hUSD: settings.minVolume24hUSD,
                    maxDailyLoss: settings.maxDailyLoss,
                    maxPortfolioCapUSD: settings.maxPortfolioCapUSD,
                    maxSlippagePct: settings.maxSlippagePct,
                    closeWhileFundingPositive: settings.closeWhileFundingPositive,
                    spreadCloseThresholdPct: settings.spreadCloseThresholdPct,
                    spreadCloseForcePct: settings.spreadCloseForcePct,
                    targetProfitPct: settings.targetProfitPct,
                    profitTrailingDropPct: settings.profitTrailingDropPct,
                  });
                  setIsEditing(true);
                }}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-indigo-500"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void salvar()}
                  disabled={enviando}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
