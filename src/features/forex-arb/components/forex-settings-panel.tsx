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
};

/**
 * Configurações do Scalping Forex Pepperstone: trade size, perda diária máxima
 * e execução automática, além dos perfis por par (TP/SL/trailing/spread). As
 * credenciais cTrader são cadastradas na tela de Exchange (não duplicadas aqui).
 * Client component com form controlado; mutações via Server Actions + `router.refresh`.
 */
export function ForexSettingsPanel({
  settings,
}: ForexSettingsPanelProps): React.ReactNode {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<AtualizarForexSettingsInput | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const atuais: ForexArbSettings = settings ?? {
    isScanningEnabled: false,
    tradeSize: 100,
    maxDailyLoss: 10,
    autoExecute: true,
    accountType: "demo",
    accountId: "",
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
    const payload = { ...form };
    delete payload.resolvedSymbolProfiles;
    executar(() => salvarSettings(payload), "Configurações salvas com sucesso!");
    setEditando(false);
  };

  const atualizar = (campo: keyof AtualizarForexSettingsInput, valor: unknown): void => {
    setForm((prev) => ({ ...(prev ?? atuais), [campo]: valor }));
  };

  const pares = [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "AUD/USD",
    "USD/CAD",
    "BTC/USD",
    "XAU/USD",
    "NAS100",
    "US30",
    "GER40",
  ] as const;

  // Exibe o perfil por par. Segue esta prioridade:
  // 1) Em edição: valor local do form (reflete o que o usuário está editando agora).
  // 2) Fora de edição: perfil efetivo resolvido pelo backend (defaults + override),
  //    para mostrar o valor real que o robô utiliza, nunca "padrão" vazio.
  // 3) Fallback: override cru do banco.
  const perfilPar = (sym: string): Record<string, unknown> => {
    const local = form?.symbolProfiles?.[sym];
    if (editando && local && Object.keys(local).length > 0) return local;
    const resolved = atuais.resolvedSymbolProfiles?.[sym];
    if (resolved && Object.keys(resolved).length > 0) return resolved;
    return formAtual.symbolProfiles?.[sym] ?? {};
  };

  const atualizarPar = (sym: string, campo: string, valor: unknown): void => {
    const atual = form?.symbolProfiles ?? atuais.symbolProfiles ?? {};
    const perfil: Record<string, unknown> = { ...atual[sym] };
    if (valor === undefined || valor === null) {
      delete perfil[campo];
    } else {
      perfil[campo] = valor;
    }
    atualizar("symbolProfiles", { ...atual, [sym]: perfil });
  };

  const formAtual = form ?? atuais;

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-white">Configurações Peperstone Forex</h3>
            <p className="text-xs text-slate-400">
              Conta:{" "}
              <b
                className={
                  (formAtual.accountType ?? "demo") === "live"
                    ? "text-rose-400"
                    : "text-emerald-400"
                }
              >
                {(formAtual.accountType ?? "demo").toUpperCase()}
              </b>{" "}
              {formAtual.accountId ? `(#${formAtual.accountId})` : ""} | Trade Size:{" "}
              <b className="text-white">${formAtual.tradeSize}</b>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editando ? (
            <button
              type="button"
              onClick={() => {
                // Inicia a edição a partir dos perfis efetivos (defaults + override),
                // para o usuário ver os valores reais que o robô utiliza.
                const base = atuais.resolvedSymbolProfiles ?? atuais.symbolProfiles ?? {};
                setForm({ ...atuais, symbolProfiles: { ...base } });
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
          {/* Identificação de Conta Pepperstone / cTrader (Demo ou Live) */}
          <div className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-400">
              🔌 Conexão Pepperstone (cTrader Open API)
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-xs text-slate-300 font-semibold"
                  htmlFor="fx-account-type"
                >
                  Tipo de Conta cTrader
                </label>
                <select
                  id="fx-account-type"
                  value={formAtual.accountType ?? "demo"}
                  onChange={(e) => atualizar("accountType", e.target.value)}
                  className="w-full rounded border border-indigo-500/30 bg-slate-900 px-2 py-1.5 text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                >
                  <option value="demo">🟢 Demo (Simulação / Testes)</option>
                  <option value="live">🔴 Live (Conta Real / Produção)</option>
                </select>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs text-slate-300 font-semibold"
                  htmlFor="fx-account-id"
                >
                  Número da Conta cTrader (Account ID / ctidTraderAccountId)
                </label>
                <input
                  id="fx-account-id"
                  type="text"
                  placeholder="Ex: 3847291"
                  value={formAtual.accountId ?? ""}
                  onChange={(e) => atualizar("accountId", e.target.value)}
                  className="w-full rounded border border-indigo-500/30 bg-slate-900 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

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
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <span className="mb-3 block text-xs text-slate-400">
              Configurações por Par (scalping)
            </span>
            <div className="space-y-3">
              {pares.map((sym) => {
                const p = perfilPar(sym);
                const ativo = p.enabled !== false;
                return (
                  <div key={sym} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{sym}</span>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={(e) => atualizarPar(sym, "enabled", e.target.checked)}
                          className="rounded border-slate-600 bg-slate-800"
                        />
                        Ativo
                      </label>
                    </div>
                    {ativo ? (
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
                        <div>
                          <label htmlFor={`tp-${sym}`} className="mb-1 block text-slate-500">
                            TP (%)
                          </label>
                          <input
                            id={`tp-${sym}`}
                            type="number"
                            step="0.01"
                            value={typeof p.takeProfitPct === "number" ? p.takeProfitPct : ""}
                            placeholder="padrão"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "takeProfitPct",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-emerald-500/30 bg-slate-900 px-2 py-1 text-emerald-400"
                          />
                        </div>
                        <div>
                          <label htmlFor={`sl-${sym}`} className="mb-1 block text-slate-500">
                            SL (%)
                          </label>
                          <input
                            id={`sl-${sym}`}
                            type="number"
                            step="0.01"
                            value={typeof p.stopLossPct === "number" ? p.stopLossPct : ""}
                            placeholder="padrão"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "stopLossPct",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-rose-500/30 bg-slate-900 px-2 py-1 text-rose-400"
                          />
                        </div>
                        <div>
                          <label htmlFor={`tact-${sym}`} className="mb-1 block text-slate-500">
                            Trailing Ativa (US$)
                          </label>
                          <input
                            id={`tact-${sym}`}
                            type="number"
                            step="0.01"
                            value={
                              typeof p.trailingActivationUsd === "number"
                                ? p.trailingActivationUsd
                                : ""
                            }
                            placeholder="padrão"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "trailingActivationUsd",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-cyan-500/30 bg-slate-900 px-2 py-1 text-cyan-400"
                          />
                        </div>
                        <div>
                          <label htmlFor={`tdist-${sym}`} className="mb-1 block text-slate-500">
                            Trailing Dist. (US$)
                          </label>
                          <input
                            id={`tdist-${sym}`}
                            type="number"
                            step="0.01"
                            value={
                              typeof p.trailingDistanceUsd === "number" ? p.trailingDistanceUsd : ""
                            }
                            placeholder="padrão"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "trailingDistanceUsd",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor={`lote-${sym}`} className="mb-1 block text-slate-500">
                            Lote (unid.)
                          </label>
                          <input
                            id={`lote-${sym}`}
                            type="number"
                            step="100"
                            min="1"
                            value={typeof p.defaultTradeSize === "number" ? p.defaultTradeSize : ""}
                            placeholder="padrão"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "defaultTradeSize",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-amber-500/30 bg-slate-900 px-2 py-1 text-amber-300 font-bold"
                          />
                        </div>
                        <div>
                          <label htmlFor={`spread-${sym}`} className="mb-1 block text-slate-500">
                            Spread Máx (%)
                          </label>
                          <input
                            id={`spread-${sym}`}
                            type="number"
                            step="0.001"
                            value={typeof p.maxSpreadPct === "number" ? p.maxSpreadPct : ""}
                            placeholder="padrão"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "maxSpreadPct",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-600">
                        Par desativado — não abrirá novas posições.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
