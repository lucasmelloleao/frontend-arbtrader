"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Save, Settings } from "lucide-react";

import { salvarDerivSettings } from "@/features/deriv/deriv.actions";
import type { DerivSettings } from "@/features/deriv/deriv.schema";

type DerivSettingsPanelProps = {
  settings: DerivSettings | null;
};

export function DerivSettingsPanel({ settings }: DerivSettingsPanelProps): React.ReactNode {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [appId, setAppId] = useState(settings?.appId || "34kQP2mEzJFjAJ2q1atub");
  const [accountType, setAccountType] = useState(settings?.accountType ?? "demo");
  const [demoApiToken, setDemoApiToken] = useState(
    settings?.demoApiToken ?? settings?.apiToken ?? "",
  );
  const [realApiToken, setRealApiToken] = useState(settings?.realApiToken ?? "");
  const [isScanningEnabled, setIsScanningEnabled] = useState(settings?.isScanningEnabled ?? false);
  const [allowLiveTrading, setAllowLiveTrading] = useState(settings?.allowLiveTrading ?? false);
  const [tradeSize, setTradeSize] = useState(settings?.tradeSize ?? 5);
  const [maxOpenContracts, setMaxOpenContracts] = useState(settings?.maxOpenContracts ?? 3);
  const [maxDailyLoss, setMaxDailyLoss] = useState(settings?.maxDailyLoss ?? 10);
  const [emergencyStopPct, setEmergencyStopPct] = useState(settings?.emergencyStopPct ?? 20);
  const [minTakeProfitPct, setMinTakeProfitPct] = useState(settings?.minTakeProfitPct ?? 2.0);
  const [minPayoutPct, setMinPayoutPct] = useState(settings?.minPayoutPct ?? 35.0);
  const [minHighCertaintyProb, setMinHighCertaintyProb] = useState(
    Math.round((settings?.minHighCertaintyProb ?? 0.75) * 100)
  );
  const [contractDurationSec, setContractDurationSec] = useState(
    settings?.contractDurationSec ?? 300
  );
  const [allowedSymbolsStr, setAllowedSymbolsStr] = useState(
    (settings?.allowedSymbols ?? ["R_100", "R_50", "frxBTCUSD"]).join(", ")
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setMensagem(null);

    startTransition(async () => {
      const symbolsArray = allowedSymbolsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await salvarDerivSettings({
        appId,
        accountType,
        demoApiToken,
        realApiToken,
        apiToken: accountType === "real" ? realApiToken : demoApiToken,
        isScanningEnabled,
        allowLiveTrading,
        tradeSize,
        maxOpenContracts,
        maxDailyLoss,
        emergencyStopPct,
        minTakeProfitPct,
        minPayoutPct,
        minHighCertaintyProb: Number((minHighCertaintyProb / 100).toFixed(2)),
        contractDurationSec,
        allowedSymbols: symbolsArray,
      });

      if (res.ok) {
        setMensagem({ tipo: "ok", texto: "Configurações da Deriv salvas com sucesso!" });
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
        <span className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          Configurações do Robô Deriv (WebSocket Options)
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {mensagem !== null ? (
            <div
              className={`rounded-lg p-3 text-xs font-semibold ${
                mensagem.tipo === "ok"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {mensagem.texto}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Seletor de Ambiente: Demo vs Real */}
            <div>
              <label
                htmlFor="account-type-select"
                className="block text-xs font-semibold text-slate-300"
              >
                Ambiente Operacional Deriv
              </label>
              <select
                id="account-type-select"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-sans text-xs font-bold text-white outline-none focus:border-emerald-500"
              >
                <option value="demo">🎮 Conta Demo (Virtual / DOT)</option>
                <option value="real">💎 Conta Real (Produção / ROT)</option>
              </select>
            </div>

            {/* Token Demo */}
            <div>
              <label
                htmlFor="demo-api-token-input"
                className="block text-xs font-semibold text-slate-300"
              >
                API Token - Conta Demo (DOT... / pat_...)
              </label>
              <input
                id="demo-api-token-input"
                type="password"
                value={demoApiToken}
                onChange={(e) => setDemoApiToken(e.target.value)}
                placeholder="Token gerado na Conta Demo"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Token Real */}
            <div>
              <label
                htmlFor="real-api-token-input"
                className="block text-xs font-semibold text-slate-300"
              >
                API Token - Conta Real (ROT... / pat_...)
              </label>
              <input
                id="real-api-token-input"
                type="password"
                value={realApiToken}
                onChange={(e) => setRealApiToken(e.target.value)}
                placeholder="Token gerado na Conta Real"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* App ID */}
            <div>
              <label htmlFor="app-id-input" className="block text-xs font-semibold text-slate-300">
                App ID Deriv (Padrão: 1089)
              </label>
              <input
                id="app-id-input"
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Habilitar Scanner WebSocket */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div>
                <label
                  htmlFor="deriv-scan-enabled"
                  className="cursor-pointer text-xs font-semibold text-white"
                >
                  Scanner WebSocket Ativo
                </label>
                <p className="text-[10px] text-slate-400">Monitorar mercado em tempo real</p>
              </div>
              <input
                id="deriv-scan-enabled"
                type="checkbox"
                checked={isScanningEnabled}
                onChange={(e) => setIsScanningEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {/* Habilitar Live Trading */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div>
                <label
                  htmlFor="deriv-live-enabled"
                  className="cursor-pointer text-xs font-semibold text-white"
                >
                  Operações Reais Ativas
                </label>
                <p className="text-[10px] text-slate-400">Enviar ordens reais para a Deriv</p>
              </div>
              <input
                id="deriv-live-enabled"
                type="checkbox"
                checked={allowLiveTrading}
                onChange={(e) => setAllowLiveTrading(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {/* Aporte por Contrato */}
            <div>
              <label
                htmlFor="deriv-trade-size"
                className="block text-xs font-semibold text-slate-300"
              >
                Aporte por Contrato (USD)
              </label>
              <input
                id="deriv-trade-size"
                type="number"
                min={1}
                value={tradeSize}
                onChange={(e) => setTradeSize(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Máximo de Contratos Abertos */}
            <div>
              <label
                htmlFor="deriv-max-contracts"
                className="block text-xs font-semibold text-slate-300"
              >
                Máximo de Contratos Simultâneos
              </label>
              <input
                id="deriv-max-contracts"
                type="number"
                min={1}
                value={maxOpenContracts}
                onChange={(e) => setMaxOpenContracts(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Perda Máxima Diária USD */}
            <div>
              <label
                htmlFor="deriv-max-daily-loss"
                className="block text-xs font-semibold text-slate-300"
              >
                Perda Máxima Diária (USD)
              </label>
              <input
                id="deriv-max-daily-loss"
                type="number"
                min={1}
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Stop Loss Emergência % */}
            <div>
              <label
                htmlFor="deriv-stop-pct"
                className="block text-xs font-semibold text-slate-300"
              >
                Stop Loss Emergência (%)
              </label>
              <input
                id="deriv-stop-pct"
                type="number"
                step="1"
                value={emergencyStopPct}
                onChange={(e) => setEmergencyStopPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Lucro Mínimo Saída % */}
            <div>
              <label htmlFor="deriv-tp-pct" className="block text-xs font-semibold text-slate-300">
                Lucro Mínimo Saída Antecipada (%)
              </label>
              <input
                id="deriv-tp-pct"
                type="number"
                step="0.1"
                value={minTakeProfitPct}
                onChange={(e) => setMinTakeProfitPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Payout Líquido Mínimo % */}
            <div>
              <label htmlFor="deriv-min-payout-pct" className="block text-xs font-semibold text-slate-300">
                💰 Payout Líquido Mínimo (%)
              </label>
              <input
                id="deriv-min-payout-pct"
                type="number"
                step="1"
                min={10}
                max={200}
                value={minPayoutPct}
                onChange={(e) => setMinPayoutPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
              <p className="mt-0.5 text-[10px] text-slate-400">Rejeita propostas que paguem menos</p>
            </div>

            {/* Certeza Mínima de Entrada % */}
            <div>
              <label htmlFor="deriv-certainty-prob" className="block text-xs font-semibold text-slate-300">
                🎯 Certeza Mínima de Entrada (%)
              </label>
              <input
                id="deriv-certainty-prob"
                type="number"
                min={50}
                max={99}
                step={1}
                value={minHighCertaintyProb}
                onChange={(e) => setMinHighCertaintyProb(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
              <p className="mt-0.5 text-[10px] text-slate-400">Só entra se prob. calculada for maior</p>
            </div>

            {/* Duração do Contrato em Segundos */}
            <div>
              <label htmlFor="deriv-duration-sec" className="block text-xs font-semibold text-slate-300">
                ⏱️ Duração do Contrato (Segundos)
              </label>
              <input
                id="deriv-duration-sec"
                type="number"
                min={15}
                step={15}
                value={contractDurationSec}
                onChange={(e) => setContractDurationSec(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
              <p className="mt-0.5 text-[10px] text-slate-400">Ex: 60 (1m), 180 (3m), 300 (5m)</p>
            </div>

            {/* Ativos / Símbolos Permitidos */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="deriv-allowed-symbols" className="block text-xs font-semibold text-slate-300">
                📊 Ativos Analisados (Separados por vírgula)
              </label>
              <input
                id="deriv-allowed-symbols"
                type="text"
                value={allowedSymbolsStr}
                onChange={(e) => setAllowedSymbolsStr(e.target.value)}
                placeholder="R_100, R_50, frxBTCUSD, frxETHUSD"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
              <p className="mt-0.5 text-[10px] text-slate-400">Índices Sintéticos e Cripto (ex: R_100, R_50, R_25, frxBTCUSD)</p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-800 pt-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Salvar Configurações
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
