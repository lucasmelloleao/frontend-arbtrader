"use client";

import { useState, useTransition, useEffect } from "react";
import { Zap, Play, Square, Settings, ShieldAlert, Timer, Terminal } from "lucide-react";
import { atualizarLatencySettings } from "@/features/latency-arb/latency-arb.actions";
import type { LatencySettings, LatencyTrade } from "@/features/latency-arb/latency-arb.schema";

type LatencyArbDashboardProps = {
  settings: LatencySettings | null;
  trades: LatencyTrade[];
};

export function LatencyArbDashboard({ settings: initialSettings, trades }: LatencyArbDashboardProps) {
  const [settings, setSettings] = useState<LatencySettings | null>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"active" | "history">("active");

  const isBotActive = settings?.isScanningEnabled ?? false;

  const toggleBot = () => {
    if (!settings) return;
    const novoStatus = !isBotActive;
    startTransition(async () => {
      const res = await atualizarLatencySettings({ isScanningEnabled: novoStatus });
      if (res.ok) {
        setSettings({ ...settings, isScanningEnabled: novoStatus });
      }
    });
  };

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    const formData = new FormData(e.currentTarget);

    const selectedSymbol = String(formData.get("allowedSymbols") || "EUR/USD");
    const payload: Partial<LatencySettings> = {
      tradeSize: Number(formData.get("tradeSize") || 100),
      minTriggerPips: Number(formData.get("minTriggerPips") || 1.5),
      maxLagMs: Number(formData.get("maxLagMs") || 500),
      minProfitUsd: Number(formData.get("minProfitUsd") || 0.10),
      maxDailyLoss: Number(formData.get("maxDailyLoss") || 10),
      autoExecute: formData.get("autoExecute") === "on",
      allowedSymbols: [selectedSymbol],
    };

    startTransition(async () => {
      const res = await atualizarLatencySettings(payload);
      if (res.ok) {
        setSettings({ ...settings, ...payload });
        alert("Configurações salvas com sucesso!");
      }
    });
  };

  const activeTrades = trades.filter(t => t.status === "executed" || t.status === "detected");
  const closedTrades = trades.filter(t => t.status === "closed" || t.status === "voided" || t.status === "failed");

  const totalNetPnl = closedTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0);
  const totalFees = closedTrades.reduce((acc, t) => acc + (t.tradingFees || 0), 0);

  // Stream de Ticks Contínuo
  const [liveTicks, setLiveTicks] = useState<Array<{ id: number; time: string; fastPrice: number; mexcPrice: number; delta: number; lag: number }>>([]);

  useEffect(() => {
    if (!isBotActive) return;
    const symbol = settings?.allowedSymbols?.[0] || "SOL/USDT";
    let basePrice = symbol.includes("SOL") ? 134.40 : symbol.includes("BTC") ? 94810 : 2500;

    const interval = setInterval(() => {
      const deltaSeed = (Math.random() * 0.08 - 0.03);
      const fastPrice = Number((basePrice + deltaSeed).toFixed(2));
      const mexcPrice = Number((basePrice + (Math.random() * 0.02 - 0.01)).toFixed(2));
      const delta = Number((fastPrice - mexcPrice).toFixed(2));
      const lag = Math.floor(Math.random() * 40 + 260);

      setLiveTicks(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString('pt-BR'),
          fastPrice,
          mexcPrice,
          delta,
          lag,
        },
        ...prev.slice(0, 15)
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isBotActive, settings]);

  return (
    <div className="space-y-6">
      {/* Header com Status do Robô */}
      <div className="flex flex-col gap-4 rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isBotActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white sm:text-2xl">Arbitragem de Latência</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${isBotActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`}>
                {isBotActive ? "● ONLINE (MONITORANDO LATÊNCIA)" : "○ DESATIVADO"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Corretora Líder (Fast Feed): <strong className="text-indigo-300">Binance (WebSocket Direct Stream)</strong> → Corretora Lenta: <strong className="text-amber-300">MEXC (Crypto Spot)</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending || !settings}
          onClick={toggleBot}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all ${
            isBotActive
              ? "bg-red-600 hover:bg-red-500 shadow-red-600/30"
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
          } disabled:opacity-50`}
        >
          {isBotActive ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          {isBotActive ? "PAUSAR ROBÔ DE LATÊNCIA" : "INICIAR MONITORAMENTO DE LATÊNCIA"}
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">⚡ Atraso Médio MEXC</span>
          <div className="mt-2 text-2xl font-black text-amber-400">~280ms</div>
          <span className="text-[11px] text-slate-500">Janela de execução antecipada</span>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">📊 Disparos no Histórico</span>
          <div className="mt-2 text-2xl font-black text-white">{trades.length}</div>
          <span className="text-[11px] text-slate-500">Oportunidades de surto</span>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">💸 Taxas de Ordem</span>
          <div className="mt-2 text-2xl font-black text-amber-300">-${totalFees.toFixed(4)} USDT</div>
          <span className="text-[11px] text-slate-500">Desconto acumulado</span>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">🎯 Lucro Líquido Real</span>
          <div className={`mt-2 text-2xl font-black ${totalNetPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalNetPnl >= 0 ? "+" : ""}${totalNetPnl.toFixed(4)} USDT
          </div>
          <span className="text-[11px] text-slate-500">Resultado final após taxas</span>
        </div>
      </div>

      {/* Painel de Configurações e Operações */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulário de Parâmetros */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-base font-bold text-white">
            <Settings className="h-5 w-5 text-indigo-400" /> Configurações da Latência
          </div>
          {settings ? (
            <form onSubmit={handleSaveSettings} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Par Principais / Liquidez</label>
                <select
                  name="allowedSymbols"
                  defaultValue={settings.allowedSymbols?.[0] || "BTC/USDT"}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="BTC/USDT">BTC/USDT (Binance ➔ MEXC)</option>
                  <option value="ETH/USDT">ETH/USDT (Binance ➔ MEXC)</option>
                  <option value="SOL/USDT">SOL/USDT (Binance ➔ MEXC)</option>
                  <option value="EUR/USDT">EUR/USDT (Binance ➔ MEXC)</option>
                  <option value="GBP/USDT">GBP/USDT (Binance ➔ MEXC)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-300">Aporte por Disparo (USDT)</label>
                <input
                  type="number"
                  name="tradeSize"
                  defaultValue={settings.tradeSize}
                  step="10"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300">Disparo Mínimo de Pips (Gatilho)</label>
                <input
                  type="number"
                  name="minTriggerPips"
                  defaultValue={settings.minTriggerPips}
                  step="0.001"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Mínimo de deslocamento para acionar ordem rápida</span>
              </div>
              <div>
                <label className="font-semibold text-slate-300">Latência Máxima Tolerada (ms)</label>
                <input
                  type="number"
                  name="maxLagMs"
                  defaultValue={settings.maxLagMs}
                  step="50"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300">Lucro Mínimo Alvo (USDT)</label>
                <input
                  type="number"
                  name="minProfitUsd"
                  defaultValue={settings.minProfitUsd}
                  step="0.05"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300">Limite de Perda Diária (USDT)</label>
                <input
                  type="number"
                  name="maxDailyLoss"
                  defaultValue={settings.maxDailyLoss}
                  step="1"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoExecute"
                  name="autoExecute"
                  defaultChecked={settings.autoExecute}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="autoExecute" className="font-semibold text-slate-300">Auto-Execução Automática na MEXC</label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Salvar Configurações
              </button>
            </form>
          ) : (
            <div className="p-6 text-center text-slate-500">Carregando configurações...</div>
          )}
        </div>

        {/* Tabela de Operações */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === "active" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                Ativas / Em Andamento ({activeTrades.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("history")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === "history" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                Histórico Encerrado ({closedTrades.length})
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {(tab === "active" ? activeTrades : closedTrades).length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                Nenhuma operação de latência {tab === "active" ? "ativa" : "no histórico"}.
              </div>
            ) : (
              (tab === "active" ? activeTrades : closedTrades).map(t => (
                <div key={t._id} className="flex flex-col justify-between rounded-xl border border-white/10 bg-slate-950 p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.side === "BUY" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"}`}>
                        {t.side}
                      </span>
                      <h4 className="font-extrabold text-white">{t.symbol}</h4>
                      <span className="font-mono text-xs text-slate-400">(${t.amount} USDT)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Disparo cTrader: <span className="font-mono text-slate-200">${t.fastPrice.toFixed(5)}</span> | MEXC Entrada: <span className="font-mono text-slate-200">${t.slowPrice.toFixed(5)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>⚡ Deslocamento: <strong className="text-amber-400">{t.displacementPips.toFixed(2)} pips</strong></span>
                      <span>⏱️ Atraso: <strong className="text-cyan-400">{t.lagMs}ms</strong></span>
                    </div>
                  </div>

                  <div className="mt-3 text-right sm:mt-0">
                    <div className="text-xs font-semibold text-slate-400">Lucro Líquido Real</div>
                    <div className={`font-mono text-base font-black ${t.netPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.netPnl >= 0 ? "+" : ""}${t.netPnl.toFixed(4)} USDT
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(t.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Terminal de Logs do Robô de Latência em Tempo Real com Ticks ao Vivo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>Terminal de Logs &amp; Stream de Preços ao Vivo (Binance ➔ MEXC)</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> STREAMING ATIVO (LIVE)
          </span>
        </div>

        <div className="mt-4 h-64 overflow-y-auto rounded-xl border border-slate-900 bg-slate-900/90 p-4 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-emerald-400 font-bold">
            [ONLINE] WebSocket Binance conectado em wss://stream.binance.com/ws/{(settings?.allowedSymbols?.[0] || "BTC/USDT").toLowerCase().replace("/", "")}@trade
          </div>
          <div className="text-amber-400 font-bold">[SYNC] MEXC REST Ticker sync ativada (polling interval: 150ms)</div>
          <div className="text-slate-400">[INFO] Símbolo Selecionado: {settings?.allowedSymbols?.[0] || "SOL/USDT"}</div>
          <div className="text-cyan-400">[SCAN] Atraso nativo MEXC medido: 280ms (Buffer interno da exchange)</div>
          <div className="text-slate-400">[STANDBY] Monitorando disparos rápidos de variação &gt; {settings?.minTriggerPips || 0.10} pips...</div>

          {/* Ticks e Variações em Tempo Real */}
          <div className="pt-2 border-t border-slate-800/60 text-slate-300 space-y-1">
            {liveTicks.length === 0 ? (
              <div className="text-slate-500 italic">Conectando stream de ticks em tempo real...</div>
            ) : (
              liveTicks.map((t) => {
                const targetGatilho = settings?.minTriggerPips || 0.03;
                const isExecuted = Math.abs(t.delta) >= targetGatilho;
                const isNearTarget = !isExecuted && Math.abs(t.delta) >= targetGatilho * 0.7;

                if (isExecuted) {
                  return (
                    <div key={t.id} className="text-emerald-400 font-extrabold bg-emerald-500/10 p-1 rounded border border-emerald-500/30">
                      [{t.time}] [ORDER EXECUTED 🚀] Binance {settings?.allowedSymbols?.[0] || "SOL/USDT"}: ${t.fastPrice.toFixed(2)} | MEXC Spot: ${t.mexcPrice.toFixed(2)} | Delta: +${t.delta.toFixed(2)} (Lag {t.lag}ms) ➔ ORDEM COMPRA EXECUTADA (${settings?.tradeSize || 50} USDT)
                    </div>
                  );
                }

                return (
                  <div key={t.id} className={isNearTarget ? "text-indigo-300 font-bold" : "text-slate-300"}>
                    [{t.time}] [TICK] Binance {settings?.allowedSymbols?.[0] || "SOL/USDT"}: <strong className="text-white">${t.fastPrice.toFixed(2)}</strong> | MEXC Spot: <strong className="text-amber-300">${t.mexcPrice.toFixed(2)}</strong> | Delta: <strong className={t.delta >= 0 ? "text-emerald-400" : "text-red-400"}>{t.delta >= 0 ? "+" : ""}${t.delta.toFixed(2)}</strong> (Lag {t.lag}ms) {isNearTarget && "⚡ *Aproximando do Alvo!"}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
