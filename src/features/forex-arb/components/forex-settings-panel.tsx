"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Coins, Globe, Plus, Save, Search, Wallet } from "lucide-react";

import {
  buscarSimbolosDisponiveis,
  salvarSettings,
  type MutacaoResult,
} from "@/features/forex-arb/forex-arb.actions";
import type {
  AtualizarForexSettingsInput,
  ForexArbSettings,
} from "@/features/forex-arb/forex-arb.schema";

const DEFAULT_FOREX_PARES = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "XAU/USD",
  "NAS100",
  "US30",
  "GER40",
];

const DEFAULT_CRYPTO_PARES = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "LTC/USD", "DOGE/USD"];

function isCryptoPair(sym: string): boolean {
  const s = sym.toUpperCase().replace("/", "");
  return (
    s.startsWith("BTC") ||
    s.startsWith("ETH") ||
    s.startsWith("SOL") ||
    s.startsWith("XRP") ||
    s.startsWith("LTC") ||
    s.startsWith("DOGE") ||
    s.startsWith("ADA") ||
    s.startsWith("AVAX") ||
    s.startsWith("DOT") ||
    s.startsWith("LINK") ||
    s.startsWith("BNB") ||
    s.startsWith("SHIB") ||
    s.startsWith("NEAR") ||
    s.startsWith("MATIC") ||
    s.startsWith("UNI") ||
    s.startsWith("BCH") ||
    s.endsWith("USDT")
  );
}

type ForexSettingsPanelProps = {
  settings: ForexArbSettings | null;
};

/**
 * Configurações do Scalping Forex Pepperstone: trade size, perda diária máxima
 * e execução automática, além dos perfis por par (TP/SL/trailing/spread). As
 * credenciais cTrader são cadastradas na tela de Exchange (não duplicadas aqui).
 * Client component com form controlado; mutações via Server Actions + `router.refresh`.
 */
export function ForexSettingsPanel({ settings }: ForexSettingsPanelProps): React.ReactNode {
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
    onlyLondonNySession: true,
    sessionStartHourBrt: 4,
    sessionEndHourBrt: 17,
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

  const [availableCrypto, setAvailableCrypto] = useState<string[]>(DEFAULT_CRYPTO_PARES);
  const [cryptoSearch, setCryptoSearch] = useState("");

  useEffect(() => {
    async function carregarSimbolos(): Promise<void> {
      try {
        const res = await buscarSimbolosDisponiveis();
        if (res.crypto.length > 0) {
          setAvailableCrypto(Array.from(new Set([...DEFAULT_CRYPTO_PARES, ...res.crypto])));
        }
      } catch {
        // Ignora erro silencioso no carregamento
      }
    }
    void carregarSimbolos();
  }, []);

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

  const adicionarParCrypto = (sym: string): void => {
    const clean = sym.trim().toUpperCase();
    if (!clean) return;
    atualizarPar(clean, "enabled", true);
    atualizarPar(clean, "takeProfitPct", 0.35);
    atualizarPar(clean, "stopLossPct", 0.15);
    atualizarPar(clean, "trailingActivationUsd", 2.0);
    atualizarPar(clean, "trailingDistanceUsd", 0.8);
    atualizarPar(clean, "defaultTradeSize", 100);
    atualizarPar(clean, "maxSpreadPct", 0.05);
    setCryptoSearch("");
  };

  const formAtual = form ?? atuais;

  // Coleta todos os pares de cada categoria presentes nas configs atuais ou defaults
  const activeProfilesKeys = Object.keys(formAtual.symbolProfiles || {});
  const resolvedProfilesKeys = Object.keys(atuais.resolvedSymbolProfiles || {});
  const allKnownKeys = Array.from(
    new Set([
      ...DEFAULT_FOREX_PARES,
      ...DEFAULT_CRYPTO_PARES,
      ...activeProfilesKeys,
      ...resolvedProfilesKeys,
    ]),
  );

  const paresForex = allKnownKeys.filter((s) => !isCryptoPair(s));
  const paresCrypto = allKnownKeys.filter((s) => isCryptoPair(s));

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
              <b className="text-white">${formAtual.tradeSize}</b> | Horário:{" "}
              <b
                className={
                  (formAtual.onlyLondonNySession ?? true) ? "text-indigo-400" : "text-amber-400"
                }
              >
                {(formAtual.onlyLondonNySession ?? true)
                  ? `04:00 às 17:00 BRT (Londres/NY)`
                  : "24 horas"}
              </b>
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

          {/* Horário de Operação / Janela Prioritária */}
          <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-cyan-400">
              🕒 Horário de Operação (Janela de Liquidez)
            </span>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="mb-1 block text-xs font-semibold text-slate-300">
                  Modo de Operação
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200 mt-2">
                  <input
                    type="checkbox"
                    checked={formAtual.onlyLondonNySession ?? true}
                    onChange={(e) => atualizar("onlyLondonNySession", e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span>
                    {(formAtual.onlyLondonNySession ?? true)
                      ? "Prioritário: 04:00 às 17:00 BRT"
                      : "24 horas por dia"}
                  </span>
                </label>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-slate-300"
                  htmlFor="fx-session-start"
                >
                  Início (Horário de Brasília)
                </label>
                <input
                  id="fx-session-start"
                  type="number"
                  min="0"
                  max="23"
                  value={formAtual.sessionStartHourBrt ?? 4}
                  disabled={!(formAtual.onlyLondonNySession ?? true)}
                  onChange={(e) => atualizar("sessionStartHourBrt", Number(e.target.value))}
                  className="w-full rounded border border-cyan-500/30 bg-slate-900 px-2 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-semibold text-slate-300"
                  htmlFor="fx-session-end"
                >
                  Término (Horário de Brasília)
                </label>
                <input
                  id="fx-session-end"
                  type="number"
                  min="0"
                  max="23"
                  value={formAtual.sessionEndHourBrt ?? 17}
                  disabled={!(formAtual.onlyLondonNySession ?? true)}
                  onChange={(e) => atualizar("sessionEndHourBrt", Number(e.target.value))}
                  className="w-full rounded border border-cyan-500/30 bg-slate-900 px-2 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Recomendação: operar prioritariamente entre 04:00 e 17:00 BRT (sessões de Londres e
              Nova York) para spreads menores e maior liquidez.
            </p>
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

          {/* Grupo 1: Moedas Cripto (Spot) */}
          <div className="mt-4 border-t border-amber-500/20 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Grupo Crypto Currency (Spot)
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Operações 24/7 · Lote em Valor USD
                </span>
              </div>

              {/* Busca / Adição de novos pares Cripto */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar par cripto (ex: SOL/USD)..."
                    value={cryptoSearch}
                    onChange={(e) => setCryptoSearch(e.target.value.toUpperCase())}
                    className="w-48 rounded-lg border border-amber-500/30 bg-slate-900 py-1 pl-7 pr-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                {cryptoSearch && !paresCrypto.includes(cryptoSearch) && (
                  <button
                    type="button"
                    onClick={() => adicionarParCrypto(cryptoSearch)}
                    className="inline-flex items-center gap-1 rounded bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                )}
              </div>
            </div>

            {/* Sugestões de pares cTrader encontrados */}
            {cryptoSearch && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {availableCrypto
                  .filter((s) => s.includes(cryptoSearch) && !paresCrypto.includes(s))
                  .slice(0, 8)
                  .map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => adicionarParCrypto(sym)}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 transition hover:bg-amber-500 hover:text-slate-950"
                    >
                      <Plus className="h-3 w-3" /> {sym}
                    </button>
                  ))}
              </div>
            )}

            <div className="space-y-3">
              {paresCrypto.map((sym) => {
                const p = perfilPar(sym);
                const ativo = p.enabled !== false;
                return (
                  <div
                    key={sym}
                    className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-300">{sym}</span>
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400/80">
                          Crypto Spot
                        </span>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={(e) => atualizarPar(sym, "enabled", e.target.checked)}
                          className="rounded border-amber-500/50 bg-slate-800"
                        />
                        Ativo
                      </label>
                    </div>
                    {ativo ? (
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-8">
                        <div>
                          <label htmlFor={`tp-${sym}`} className="mb-1 block text-slate-500">
                            TP (%)
                          </label>
                          <input
                            id={`tp-${sym}`}
                            type="number"
                            step="0.01"
                            value={typeof p.takeProfitPct === "number" ? p.takeProfitPct : 0.35}
                            placeholder="0.35"
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
                            value={typeof p.stopLossPct === "number" ? p.stopLossPct : 0.15}
                            placeholder="0.15"
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
                                : 2.0
                            }
                            placeholder="2.00"
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
                              typeof p.trailingDistanceUsd === "number"
                                ? p.trailingDistanceUsd
                                : 0.8
                            }
                            placeholder="0.80"
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
                          <label
                            htmlFor={`lote-${sym}`}
                            className="mb-1 block text-amber-300 font-semibold"
                          >
                            Valor Usd ($)
                          </label>
                          <input
                            id={`lote-${sym}`}
                            type="number"
                            step="10"
                            min="1"
                            value={
                              typeof p.defaultTradeSize === "number" ? p.defaultTradeSize : 100
                            }
                            placeholder="100"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "defaultTradeSize",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-amber-500/40 bg-slate-900 px-2 py-1 text-amber-300 font-bold"
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
                            value={typeof p.maxSpreadPct === "number" ? p.maxSpreadPct : 0.05}
                            placeholder="0.050"
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
                        <div>
                          <label
                            htmlFor={`kauf-er-${sym}`}
                            className="mb-1 block text-indigo-400 font-medium"
                          >
                            ER Mínimo
                          </label>
                          <input
                            id={`kauf-er-${sym}`}
                            type="number"
                            step="0.05"
                            min="0.05"
                            max="0.99"
                            value={typeof p.minKaufmanEr === "number" ? p.minKaufmanEr : 0.2}
                            placeholder="0.20"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "minKaufmanEr",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-indigo-500/40 bg-slate-900 px-2 py-1 text-indigo-300 font-semibold"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`sep-pips-${sym}`}
                            className="mb-1 block text-indigo-400 font-medium"
                          >
                            Sep. Médias (Pips)
                          </label>
                          <input
                            id={`sep-pips-${sym}`}
                            type="number"
                            step="0.5"
                            min="0"
                            value={
                              typeof p.minEmaSeparationPips === "number"
                                ? p.minEmaSeparationPips
                                : 3.0
                            }
                            placeholder="3.0"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "minEmaSeparationPips",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-indigo-500/40 bg-slate-900 px-2 py-1 text-indigo-300 font-semibold"
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

          {/* Grupo 2: Forex, Metais & Índices */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Pares Forex Tradicionais, Metais & Índices
              </span>
            </div>
            <div className="space-y-3">
              {paresForex.map((sym) => {
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
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-8">
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
                        <div>
                          <label
                            htmlFor={`kauf-er-${sym}`}
                            className="mb-1 block text-indigo-400 font-medium"
                          >
                            ER Mínimo
                          </label>
                          <input
                            id={`kauf-er-${sym}`}
                            type="number"
                            step="0.05"
                            min="0.05"
                            max="0.99"
                            value={typeof p.minKaufmanEr === "number" ? p.minKaufmanEr : ""}
                            placeholder="0.20"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "minKaufmanEr",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-indigo-500/40 bg-slate-900 px-2 py-1 text-indigo-300 font-semibold"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`sep-pips-${sym}`}
                            className="mb-1 block text-indigo-400 font-medium"
                          >
                            Sep. Médias (Pips)
                          </label>
                          <input
                            id={`sep-pips-${sym}`}
                            type="number"
                            step="0.5"
                            min="0"
                            value={
                              typeof p.minEmaSeparationPips === "number"
                                ? p.minEmaSeparationPips
                                : ""
                            }
                            placeholder="3.0"
                            onChange={(e) =>
                              atualizarPar(
                                sym,
                                "minEmaSeparationPips",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            className="w-full rounded border border-indigo-500/40 bg-slate-900 px-2 py-1 text-indigo-300 font-semibold"
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
