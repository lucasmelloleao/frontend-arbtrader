"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { criarDerivStrategy, atualizarDerivStrategy } from "@/features/deriv/deriv.actions";
import type { DerivStrategy } from "@/features/deriv/deriv.schema";

const DERIV_SYMBOLS = [
  // Índices de Volatilidade 1s (Alta liquidez, 1 tick/segundo)
  { value: "1HZ10V", label: "Volatility 10 (1s) Index" },
  { value: "1HZ25V", label: "Volatility 25 (1s) Index" },
  { value: "1HZ50V", label: "Volatility 50 (1s) Index" },
  { value: "1HZ75V", label: "Volatility 75 (1s) Index" },
  { value: "1HZ100V", label: "Volatility 100 (1s) Index" },
  { value: "1HZ150V", label: "Volatility 150 (1s) Index" },
  { value: "1HZ250V", label: "Volatility 250 (1s) Index" },

  // Índices de Volatilidade Contínuos (1 tick a cada 2 segundos)
  { value: "R_10", label: "Volatility 10 Index" },
  { value: "R_25", label: "Volatility 25 Index" },
  { value: "R_50", label: "Volatility 50 Index" },
  { value: "R_75", label: "Volatility 75 Index" },
  { value: "R_100", label: "Volatility 100 Index" },

  // Índices Step (Degraus / Passos fixos de 0.1)
  { value: "stpRNG", label: "Step Index (stpRNG)" },

  // Criptomoedas
  { value: "cryBTCUSD", label: "BTC/USD (Bitcoin)" },
  { value: "cryETHUSD", label: "ETH/USD (Ethereum)" },

  // Moedas Forex
  { value: "frxEURUSD", label: "EUR/USD (Forex)" },
  { value: "frxGBPUSD", label: "GBP/USD (Forex)" },
  { value: "frxUSDJPY", label: "USD/JPY (Forex)" },
  { value: "frxAUDUSD", label: "AUD/USD (Forex)" },
];

type DerivStrategyFormProps = {
  strategyParaEditar?: DerivStrategy | null;
  onFechar: () => void;
};

export function DerivStrategyForm({
  strategyParaEditar,
  onFechar,
}: DerivStrategyFormProps): React.ReactNode {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [name, setName] = useState(strategyParaEditar?.name || "");
  const [symbol, setSymbol] = useState(strategyParaEditar?.symbol || "1HZ10V");
  const [contractType, setContractType] = useState(strategyParaEditar?.contractType || "BOTH_HL");
  const [barrier, setBarrier] = useState(strategyParaEditar?.barrier || "-0.50");
  const [barrierLower, setBarrierLower] = useState(strategyParaEditar?.barrierLower || "+0.50");
  const [tradeSize, setTradeSize] = useState(strategyParaEditar?.tradeSize ?? 2);
  const [durationSec, setDurationSec] = useState(strategyParaEditar?.durationSec ?? 15);
  const [minCertaintyProb, setMinCertaintyProb] = useState(
    strategyParaEditar ? Math.round(strategyParaEditar.minCertaintyProb * 100) : 75,
  );
  const [minTakeProfitPct, setMinTakeProfitPct] = useState(strategyParaEditar?.minTakeProfitPct ?? 15);
  const [emergencyStopPct, setEmergencyStopPct] = useState(strategyParaEditar?.emergencyStopPct ?? 70);

  const isEditing = Boolean(strategyParaEditar?.id);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    // Valida duração mínima básica
    if (durationSec < 15) {
      setErro("A duração mínima recomendada é de 15 segundos.");
      setLoading(false);
      return;
    }

    const inputData = {
      name: name.trim() || symbol,
      symbol,
      contractType,
      barrier: barrier.trim() || "-0.50",
      barrierLower: barrierLower.trim() || "+0.50",
      tradeSize: tradeSize || 2,
      durationSec: durationSec || 15,
      minCertaintyProb: minCertaintyProb / 100,
      minTakeProfitPct: minTakeProfitPct || 15,
      emergencyStopPct: emergencyStopPct || 70,
    };

    let res;
    if (isEditing && strategyParaEditar) {
      res = await atualizarDerivStrategy({ id: strategyParaEditar.id, ...inputData });
    } else {
      res = await criarDerivStrategy(inputData);
    }

    setLoading(false);
    if (res.ok) {
      onFechar();
    } else {
      setErro(res.erro || "Erro ao salvar estratégia.");
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/20 p-2 text-cyan-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {isEditing ? "Editar Estratégia por Ativo" : "Criar Nova Estratégia por Ativo"}
            </h2>
            <p className="text-xs text-slate-400">
              Parâmetros sincronizados com os limites em tempo real da Deriv
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {erro ? (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
          {erro}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Nome da Estratégia */}
          <div>
            <label
              htmlFor="deriv-strategy-name"
              className="block text-xs font-semibold text-slate-300"
            >
              Nome de Identificação
            </label>
            <input
              id="deriv-strategy-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vol 10 1s - Sniper Higher"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Ativo */}
          <div>
            <label
              htmlFor="deriv-strategy-symbol"
              className="block text-xs font-semibold text-slate-300"
            >
              Ativo / Mercado Deriv
            </label>
            <select
              id="deriv-strategy-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {DERIV_SYMBOLS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({s.value})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Contrato */}
          <div>
            <label
              htmlFor="deriv-strategy-contract-type"
              className="block text-xs font-semibold text-slate-300"
            >
              Modo de Operação
            </label>
            <select
              id="deriv-strategy-contract-type"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="BOTH_HL">Higher / Lower Automático (Com Barreira)</option>
              <option value="HIGHER">Apenas HIGHER (Comprar acima da barreira)</option>
              <option value="LOWER">Apenas LOWER (Comprar abaixo da barreira)</option>
              <option value="BOTH_RF">Rise / Fall Automático (Sem Barreira)</option>
              <option value="RISE">Apenas RISE (Call)</option>
              <option value="FALL">Apenas FALL (Put)</option>
              <option value="BOTH_MULT">Multiplicador Automático (Cripto: Up / Down)</option>
              <option value="MULTUP">Apenas Multiplicador Up (Cripto)</option>
              <option value="MULTDOWN">Apenas Multiplicador Down (Cripto)</option>
            </select>
          </div>

          {/* Duração Selecionável */}
          <div>
            <label
              htmlFor="deriv-strategy-duration"
              className="block text-xs font-semibold text-slate-300"
            >
              Duração do Contrato
            </label>
            <select
              id="deriv-strategy-duration"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value={15}>15 Segundos (15s) - Recomendado</option>
              <option value={30}>30 Segundos (30s)</option>
              <option value={45}>45 Segundos (45s)</option>
              <option value={60}>1 Minuto (60s)</option>
              <option value={120}>2 Minutos (120s)</option>
              <option value={180}>3 Minutos (180s)</option>
              <option value={300}>5 Minutos (300s)</option>
              <option value={600}>10 Minutos (600s)</option>
              <option value={900}>15 Minutos (900s)</option>
              {![15, 30, 45, 60, 120, 180, 300, 600, 900].includes(durationSec) && (
                <option value={durationSec}>{durationSec} Segundos (Personalizado)</option>
              )}
            </select>
          </div>

          {/* Barreira Higher */}
          {contractType.includes("H") || contractType.includes("L") ? (
            <>
              {/* Painel Informativo de Barreira */}
              <div className="col-span-full rounded-xl border border-cyan-500/20 bg-slate-900/60 p-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  Configuração de Barreiras Recomendadas:
                </span>
                <p className="mt-1 text-[11px] text-slate-400">
                  Para contratos Higher/Lower de 15s no ativo {symbol}, a barreira padrão
                  recomendada é <b>±0.50</b> (ou entre ±0.10 e ±2.00).
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {["0.20", "0.50", "0.80", "1.00", "1.50"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setBarrier(`-${val}`);
                        setBarrierLower(`+${val}`);
                      }}
                      className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all ${
                        barrier === `-${val}`
                          ? "bg-cyan-500 text-slate-950 shadow-md ring-1 ring-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      ±{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="deriv-strategy-barrier"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Barreira HIGHER (Offset de Margem)
                </label>
                <input
                  id="deriv-strategy-barrier"
                  type="text"
                  value={barrier}
                  onChange={(e) => setBarrier(e.target.value)}
                  placeholder="Ex: -0.50"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                />
                <span className="mt-1 block text-[10px] text-slate-500">
                  Offset negativo (ex: -0.50)
                </span>
              </div>

              <div>
                <label
                  htmlFor="deriv-strategy-barrier-lower"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Barreira LOWER (Offset de Margem)
                </label>
                <input
                  id="deriv-strategy-barrier-lower"
                  type="text"
                  value={barrierLower}
                  onChange={(e) => setBarrierLower(e.target.value)}
                  placeholder="Ex: +0.50"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                />
                <span className="mt-1 block text-[10px] text-slate-500">
                  Offset positivo (ex: +0.50)
                </span>
              </div>
            </>
          ) : null}

          {/* Aporte em USD */}
          <div>
            <label
              htmlFor="deriv-strategy-trade-size"
              className="block text-xs font-semibold text-slate-300"
            >
              Aporte por Ordem ($ USD)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
              <input
                id="deriv-strategy-trade-size"
                type="number"
                min="0.35"
                step="0.01"
                value={tradeSize}
                onChange={(e) => setTradeSize(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-slate-900 pl-7 pr-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Certeza Mínima Exigida */}
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Certeza Mínima Exigida ({minCertaintyProb}%)
            </label>
            <input
              type="range"
              min="65"
              max="98"
              step="1"
              value={minCertaintyProb}
              onChange={(e) => setMinCertaintyProb(Number(e.target.value))}
              className="mt-2 w-full accent-cyan-400"
            />
          </div>

          {/* Lucro Mínimo Saída Antecipada (Take Profit %) */}
          <div>
            <label
              htmlFor="deriv-strategy-take-profit"
              className="block text-xs font-semibold text-emerald-400"
            >
              🎯 Take Profit Antecipado (%)
            </label>
            <div className="relative mt-1">
              <input
                id="deriv-strategy-take-profit"
                type="number"
                min="2"
                max="100"
                step="1"
                value={minTakeProfitPct}
                onChange={(e) => setMinTakeProfitPct(Number(e.target.value))}
                className="w-full rounded-lg border border-emerald-500/30 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500">
              Vende antecipadamente ao atingir +{minTakeProfitPct}% de lucro
            </span>
          </div>

          {/* Stop Loss de Emergência (%) */}
          <div>
            <label
              htmlFor="deriv-strategy-stop-loss"
              className="block text-xs font-semibold text-rose-400"
            >
              🚨 Stop Loss Emergência (%)
            </label>
            <div className="relative mt-1">
              <input
                id="deriv-strategy-stop-loss"
                type="number"
                min="10"
                max="95"
                step="1"
                value={emergencyStopPct}
                onChange={(e) => setEmergencyStopPct(Number(e.target.value))}
                className="w-full rounded-lg border border-rose-500/30 bg-slate-900 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500">
              Liquida antecipadamente se o prejuízo atingir -{emergencyStopPct}%
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Estratégia"}
          </button>
        </div>
      </form>
    </div>
  );
}
