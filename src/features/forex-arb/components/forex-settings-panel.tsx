"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Save, Wallet } from "lucide-react";

import { salvarSettings, type MutacaoResult } from "@/features/forex-arb/forex-arb.actions";
import type {
  AtualizarForexSettingsInput,
  ForexArbSettings,
} from "@/features/forex-arb/forex-arb.schema";

type ForexSettingsPanelProps = {
  settings: ForexArbSettings | null;
  /** Corretoras cadastradas (para o rastreamento de oportunidades). */
  exchangeIds: readonly string[];
};

/**
 * Configurações da arbitragem Forex: parâmetros editáveis (trade size,
 * retorno mínimo, volume, ciclo, perda diária, slippage, execução automática,
 * tipos de arbitragem, corretoras rastreadas). As credenciais cTrader são
 * cadastradas na tela de Exchange (não duplicadas aqui). Client component com
 * form controlado; mutações via Server Actions + `router.refresh`.
 */
export function ForexSettingsPanel({
  settings,
  exchangeIds,
}: ForexSettingsPanelProps): React.ReactNode {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<AtualizarForexSettingsInput | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const atuais: ForexArbSettings = settings ?? {
    isScanningEnabled: false,
    lastScannedAt: null,
    tradeSize: 100,
    minProfitPct: 0.05,
    minVolume24hUSD: 50000,
    maxStrategiesPerScan: 5,
    scanIntervalMs: 60000,
    maxDailyLoss: 10,
    maxSlippagePct: 0.1,
    autoExecute: true,
    simpleEnabled: true,
    triangularEnabled: true,
    allowedExchanges: [],
    takeProfitPct: 0.1,
    stopLossPct: 0.1,
    trailingStopPct: 0.01,
  };

  const executar = (acao: () => Promise<MutacaoResult>, mensagemSucesso: string): void => {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await acao();
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setSucesso(mensagemSucesso);
      router.refresh();
    });
  };

  const salvar = (): void => {
    if (form === null) {
      return;
    }
    executar(() => salvarSettings(form), "Configurações salvas com sucesso!");
    setEditando(false);
  };

  const atualizar = (campo: keyof AtualizarForexSettingsInput, valor: unknown): void => {
    setForm((prev) => ({ ...(prev ?? atuais), [campo]: valor }));
  };

  const alternarCorretora = (ex: string): void => {
    const atual = form?.allowedExchanges ?? atuais.allowedExchanges;
    const proximo = atual.includes(ex) ? atual.filter((a) => a !== ex) : [...atual, ex];
    atualizar("allowedExchanges", proximo);
  };

  const formAtual = form ?? atuais;

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-white">Configurações da Arbitragem Forex</h3>
            <p className="text-xs text-slate-400">
              Trade Size: <b className="text-white">${formAtual.tradeSize}</b> | Retorno Mín.:{" "}
              <b className="text-emerald-400">{formAtual.minProfitPct}%</b>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editando ? (
            <button
              type="button"
              onClick={() => {
                setForm(atuais);
                setEditando(true);
              }}
              className="rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-2 text-xs font-bold text-indigo-300 transition-colors hover:bg-indigo-600 hover:text-white"
            >
              ⚙️ Ajustar Configurações
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" /> Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      {erro !== null ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erro}
        </p>
      ) : null}
      {sucesso !== null ? (
        <p className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          {sucesso}
        </p>
      ) : null}

      {editando ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="fx-trade-size">
                Trade Size (USDT)
              </label>
              <input
                id="fx-trade-size"
                type="number"
                value={formAtual.tradeSize}
                onChange={(e) => atualizar("tradeSize", Number(e.target.value))}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-amber-400 font-semibold"
                htmlFor="fx-min-profit"
              >
                Retorno Mínimo (%) - Filtro Scanner
              </label>
              <input
                id="fx-min-profit"
                type="number"
                step="0.01"
                value={formAtual.minProfitPct}
                onChange={(e) => atualizar("minProfitPct", Number(e.target.value))}
                className="w-full rounded border border-amber-500/30 bg-slate-900 px-2 py-1 text-amber-400 font-bold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="fx-min-volume">
                Volume Mínimo 24h (USDT)
              </label>
              <input
                id="fx-min-volume"
                type="number"
                value={formAtual.minVolume24hUSD}
                onChange={(e) => atualizar("minVolume24hUSD", Number(e.target.value))}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="fx-scan-interval">
                Ciclo de Scan (min)
              </label>
              <input
                id="fx-scan-interval"
                type="number"
                min="1"
                value={Math.round((formAtual.scanIntervalMs || 60000) / 60000)}
                onChange={(e) => atualizar("scanIntervalMs", Number(e.target.value) * 60000)}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="fx-max-loss">
                Max Perda Diária (USDT)
              </label>
              <input
                id="fx-max-loss"
                type="number"
                value={formAtual.maxDailyLoss}
                onChange={(e) => atualizar("maxDailyLoss", Number(e.target.value))}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="fx-slippage">
                Max Slippage (%)
              </label>
              <input
                id="fx-slippage"
                type="number"
                step="0.01"
                value={formAtual.maxSlippagePct}
                onChange={(e) => atualizar("maxSlippagePct", Number(e.target.value))}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-emerald-400 font-semibold" htmlFor="fx-tp">
                Take Profit (%)
              </label>
              <input
                id="fx-tp"
                type="number"
                step="0.01"
                value={formAtual.takeProfitPct ?? 0.1}
                onChange={(e) => atualizar("takeProfitPct", Number(e.target.value))}
                className="w-full rounded border border-emerald-500/30 bg-slate-900 px-2 py-1 text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-cyan-400 font-semibold"
                htmlFor="fx-trailing"
              >
                Trailing Stop Gatilho (%)
              </label>
              <input
                id="fx-trailing"
                type="number"
                step="0.005"
                value={formAtual.trailingStopPct ?? 0.01}
                onChange={(e) => atualizar("trailingStopPct", Number(e.target.value))}
                className="w-full rounded border border-cyan-500/30 bg-slate-900 px-2 py-1 text-cyan-400 font-bold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-rose-400 font-semibold" htmlFor="fx-sl">
                Stop Loss (%)
              </label>
              <input
                id="fx-sl"
                type="number"
                step="0.01"
                value={formAtual.stopLossPct ?? 0.1}
                onChange={(e) => atualizar("stopLossPct", Number(e.target.value))}
                className="w-full rounded border border-rose-500/30 bg-slate-900 px-2 py-1 text-rose-400 font-bold"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-slate-500">Execução Automática</span>
              <label className="flex cursor-pointer items-center gap-2 text-slate-200">
                <input
                  type="checkbox"
                  checked={formAtual.autoExecute}
                  onChange={(e) => atualizar("autoExecute", e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800"
                />
                {formAtual.autoExecute ? "Ativa" : "Desativada"}
              </label>
            </div>
            <div>
              <span className="mb-1 block text-xs text-slate-500">Tipos de Arbitragem</span>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    checked={formAtual.triangularEnabled}
                    onChange={(e) => atualizar("triangularEnabled", e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  Triangular
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    checked={formAtual.simpleEnabled}
                    onChange={(e) => atualizar("simpleEnabled", e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  Simples
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <span className="mb-2 block text-xs text-slate-500">
              Corretoras Rastreadas (oportunidades)
            </span>
            {exchangeIds.length === 0 ? (
              <span className="text-xs italic text-slate-600">
                Nenhuma corretora cadastrada — adicione na tela de Exchange.
              </span>
            ) : (
              <div className="flex flex-wrap gap-4">
                {exchangeIds.map((ex) => {
                  const marcado = formAtual.allowedExchanges.includes(ex);
                  return (
                    <label
                      key={ex}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-200 transition-colors hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => alternarCorretora(ex)}
                        className="h-4 w-4 rounded border-white/20 bg-slate-900"
                      />
                      {ex.toUpperCase()}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
