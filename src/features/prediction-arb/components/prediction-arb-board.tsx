"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { BarChart3, Brain, Clock, Power, Search, TrendingUp, X, XCircle } from "lucide-react";

import { PredictionAiStrategyView } from "@/features/prediction-arb/components/prediction-ai-strategy-view";
import {
  aumentarAporte,
  deletarStrategy,
  fecharPosicao,
  voidCloseStrategy,
  buscarTradesPrediction,
  type PredictionPeriod,
} from "@/features/prediction-arb/prediction-arb.actions";
import { UniversalTimelineChart } from "@/components/charts/universal-timeline-chart";
import { getEndMs } from "@/features/prediction-arb/prediction-arb.utils";
import type {
  PredictionArbStrategy,
  PredictionArbTrade,
} from "@/features/prediction-arb/prediction-arb.schema";

type PredictionArbBoardProps = {
  strategies: readonly PredictionArbStrategy[];
  trades: readonly PredictionArbTrade[];
  exchangeKeys?: readonly { id: string; exchangeId: string; nome: string }[];
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
const fmtPct = (v: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

const EMPTY_EXCHANGE_KEYS: readonly { id: string; exchangeId: string; nome: string }[] = [];

const INTERVALOS_FILTRO = [
  { id: "5m", label: "5 Min" },
  { id: "10m", label: "10 Min" },
  { id: "30m", label: "30 Min" },
  { id: "1h", label: "1 Hora" },
  { id: "2h", label: "2 Horas" },
  { id: "3h", label: "3 Horas" },
  { id: "5h", label: "5 Horas" },
  { id: "12h", label: "12 Horas" },
  { id: "24h", label: "24 Horas" },
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 Dias" },
  { id: "30d", label: "30 Dias" },
  { id: "all", label: "Tudo" },
] as const;

/** Mapeia título/slug de um mercado para a moeda de referência (agrupamento). */
function getCoinDetails(titleOrSlug: string): { coin: string; name: string } {
  const s = (titleOrSlug || "").toUpperCase();
  if (s.includes("BITCOIN") || s.includes("BTC")) return { coin: "BTC", name: "Bitcoin" };
  if (s.includes("ETHEREUM") || s.includes("ETH")) return { coin: "ETH", name: "Ethereum" };
  if (s.includes("SOLANA") || s.includes("SOL")) return { coin: "SOL", name: "Solana" };
  if (s.includes("XRP") || s.includes("RIPPLE")) return { coin: "XRP", name: "Ripple (XRP)" };
  if (s.includes("DOGECOIN") || s.includes("DOGE")) return { coin: "DOGE", name: "Dogecoin" };
  if (s.includes("CARDANO") || s.includes("ADA")) return { coin: "ADA", name: "Cardano" };
  if (s.includes("AVALANCHE") || s.includes("AVAX")) return { coin: "AVAX", name: "Avalanche" };
  if (s.includes("BINANCE") || s.includes("BNB")) return { coin: "BNB", name: "BNB" };
  return { coin: "OUTROS", name: "Outros Mercados" };
}

function getRemainingSeconds(strat: PredictionArbStrategy, nowMs: number): number {
  const endMs = getEndMs(strat);
  if (endMs > 0) {
    return endMs > nowMs ? Math.floor((endMs - nowMs) / 1000) : 0;
  }
  return strat.segundosParaVencer || 0;
}

/**
 * Painel principal do Polymarket Arb: abas para Posições Abertas, Estratégias Monitoradas,
 * Histórico de Trades, Lucro/Prejuízo por Ativo, IA Meta-Labeling e Depósito/Credenciais.
 */
export function PredictionArbBoard({
  strategies,
  trades: initialTrades,
  exchangeKeys: _exchangeKeys = EMPTY_EXCHANGE_KEYS,
}: PredictionArbBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [aba, setAba] = useState<"open" | "monitored" | "closed" | "performance" | "aiStrategy">(
    "open",
  );
  const [periodo, setPeriodo] = useState<PredictionPeriod>("all");
  const [tradesList, setTradesList] = useState<readonly PredictionArbTrade[]>(initialTrades);
  const [carregandoTrades, setCarregandoTrades] = useState(false);

  // Estado da aba Lucro/Prejuízo por Ativo
  const [perfPeriod, setPerfPeriod] = useState<PredictionPeriod>("all");
  const [perfTrades, setPerfTrades] = useState<readonly PredictionArbTrade[]>(initialTrades);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [perfConsulted, setPerfConsulted] = useState(true);

  const [previousInitialTrades, setPreviousInitialTrades] = useState(initialTrades);
  if (initialTrades !== previousInitialTrades) {
    setPreviousInitialTrades(initialTrades);
    if (periodo === "all") {
      setTradesList(initialTrades);
    }
    if (perfPeriod === "all") {
      setPerfTrades(initialTrades);
    }
  }

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const carregarPeriodo = async (p: PredictionPeriod): Promise<void> => {
    setPeriodo(p);
    setCarregandoTrades(true);
    const res = await buscarTradesPrediction({ periodo: p });
    setCarregandoTrades(false);
    if (res.ok) {
      setTradesList(res.trades);
    }
  };

  const consultarPerformance = async (p: PredictionPeriod): Promise<void> => {
    setPerfPeriod(p);
    setLoadingPerf(true);
    setPerfConsulted(true);
    const res = await buscarTradesPrediction({ periodo: p });
    setLoadingPerf(false);
    if (res.ok) {
      setPerfTrades(res.trades);
    }
  };

  const abertas = strategies.filter(
    (s) =>
      s.positionOpen &&
      (s.yesShares > 0 || s.noShares > 0 || (s.openOrderIds && s.openOrderIds.length > 0)),
  );
  const monitorando = strategies.filter(
    (s) =>
      !s.positionOpen ||
      (s.yesShares === 0 && s.noShares === 0 && (!s.openOrderIds || s.openOrderIds.length === 0)),
  );
  const encerradas = tradesList.filter(
    (t) =>
      // Exige investimento ou montante real para não exibir registros fantasmas/vazios de $0.00
      (t.investedUsd > 0 ||
        (t.amount > 0 && ((t.yesShares || 0) > 0 || (t.noShares || 0) > 0)) ||
        (t.yesShares || 0) > 0 ||
        (t.noShares || 0) > 0 ||
        t.pnl !== 0) &&
      (t.type === "close_pair" ||
        t.type === "close" ||
        t.type === "settlement" ||
        t.type === "voided" ||
        t.status === "closed" ||
        t.status === "executed" ||
        t.status === "simulated" ||
        t.status === "voided" ||
        t.pnl !== 0 ||
        t.realizedUsd > 0 ||
        (t.reason &&
          (t.reason.includes("venda-antecipada") ||
            t.reason.includes("redeem-vencimento") ||
            t.reason.includes("vencimento") ||
            t.reason.includes("Manual") ||
            t.reason.includes("fechar")))),
  );

  const executar = (acao: () => Promise<{ ok: boolean }>): void => {
    startTransition(async () => {
      await acao();
      router.refresh();
    });
  };

  const confirmarFechar = (strat: PredictionArbStrategy): void => {
    if (!confirm(`Encerrar a posição em "${strat.nome}"? As shares YES/NO serão vendidas.`)) {
      return;
    }
    executar(() => fecharPosicao(strat.id));
  };

  const confirmarVoid = (strat: PredictionArbStrategy): void => {
    if (!confirm(`Marcar "${strat.nome}" como encerrada pela corretora?`)) {
      return;
    }
    executar(() => voidCloseStrategy(strat.id));
  };

  const confirmarExcluir = (strat: PredictionArbStrategy): void => {
    if (!confirm(`Excluir a estratégia "${strat.nome}"?`)) {
      return;
    }
    executar(() => deletarStrategy(strat.id));
  };

  const handleAumentar = (strat: PredictionArbStrategy): void => {
    const valorStr = prompt(`Aumentar aporte para "${strat.nome}" (USDT):`, "50");
    if (!valorStr) return;
    const valor = Number(valorStr);
    if (!valor || valor <= 0) {
      alert("Valor inválido.");
      return;
    }
    executar(() => aumentarAporte(strat.id, valor));
  };

  return (
    <div className="space-y-4">
      {/* Abas */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {(
          [
            { key: "open", label: "Posições Abertas", count: abertas.length },
            { key: "monitored", label: "Monitorando", count: monitorando.length },
            {
              key: "closed",
              label: "Histórico de Trades",
              count: encerradas.length,
              icon: TrendingUp,
            },
            { key: "performance", label: "Lucro/Prejuízo por Ativo", count: null, icon: BarChart3 },
            { key: "aiStrategy", label: "IA Meta-Labeling (Gate 4)", count: null, icon: Brain },
          ] as const
        ).map((tab) => {
          const Icon = "icon" in tab ? tab.icon : null;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAba(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                aba === tab.key
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {Icon ? <Icon className="h-3.5 w-3.5 text-cyan-400" /> : null}
              {tab.label}
              {tab.count !== null ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    aba === tab.key ? "bg-white/20" : "bg-slate-800"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Aba: Posições Abertas */}
      {aba === "open" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {abertas.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma posição aberta no momento.
            </div>
          ) : (
            abertas.map((strat) => {
              const completude = strat.yesPrice + strat.noPrice;
              const spread = (1 - completude) * 100;
              return (
                <div
                  key={strat.id || strat.slug}
                  className="rounded-xl border border-emerald-500/30 bg-slate-950/70 p-5 shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-white">
                        {strat.nome || strat.slug}
                      </h3>
                      <div className="mt-0.5 text-xs text-slate-400 font-mono">{strat.slug}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-emerald-400">
                        Spread {fmtPct(spread)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Completude: {completude.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-slate-900/60 p-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Shares YES
                      </span>
                      <div className="font-mono font-bold text-emerald-300">
                        {strat.yesShares.toFixed(2)} @ ${strat.avgYesPrice.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Shares NO
                      </span>
                      <div className="font-mono font-bold text-indigo-300">
                        {strat.noShares.toFixed(2)} @ ${strat.avgNoPrice.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  {/* Mark-to-market da posição */}
                  <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Custo Total
                      </span>
                      <div className="font-mono font-bold text-white">
                        ${strat.custoTotal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Valor Atual
                      </span>
                      <div className="font-mono font-bold text-white">
                        ${strat.valorAtual.toFixed(2)}
                        <span className="ml-1 text-[10px] text-slate-500">
                          bid {strat.bidYesAtual.toFixed(2)}/{strat.bidNoAtual.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        P&L Atual
                      </span>
                      <div
                        className={`font-mono font-black ${
                          strat.pnlAtual > 0.001
                            ? "text-emerald-400"
                            : strat.pnlAtual < -0.001
                              ? "text-rose-400"
                              : "text-slate-300"
                        }`}
                      >
                        {strat.pnlAtual > 0 ? "+" : ""}${strat.pnlAtual.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Retorno no Venc.
                      </span>
                      <div className="font-mono font-bold text-white">
                        ${strat.retornoVencimento.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Lucro Garantido
                      </span>
                      <div
                        className={`font-mono font-black ${
                          strat.lucroGarantido >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {strat.lucroGarantido > 0 ? "+" : ""}${strat.lucroGarantido.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Retorno %
                      </span>
                      <div className="font-mono font-black text-emerald-400">
                        {strat.custoTotal > 0
                          ? `${((strat.retornoVencimento / strat.custoTotal - 1) * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Dados ao vivo da Polymarket */}
                  <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Best Bid/Ask
                      </span>
                      <div className="font-mono font-bold text-white">
                        {strat.bestBid.toFixed(3)} / {strat.bestAsk.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Último Trade
                      </span>
                      <div className="font-mono font-bold text-white">
                        {strat.lastTradePrice > 0 ? strat.lastTradePrice.toFixed(3) : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Vol 24h (CLOB)
                      </span>
                      <div className="font-mono font-bold text-white">
                        ${strat.volume24hr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Liquidez
                      </span>
                      <div className="font-mono font-bold text-white">
                        ${strat.liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Var. 1h
                      </span>
                      <div
                        className={`font-mono font-bold ${strat.oneHourPriceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {strat.oneHourPriceChange !== 0
                          ? fmtPct(strat.oneHourPriceChange * 100)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Vence em
                      </span>
                      <div className="font-mono font-bold text-white">
                        {(() => {
                          const sec = getRemainingSeconds(strat, nowMs);
                          if (sec <= 0)
                            return <span className="text-rose-400 font-bold">Vencido</span>;
                          if (sec <= 180) {
                            return (
                              <span className="text-amber-400 font-black">
                                {Math.floor(sec / 60)}m {String(sec % 60).padStart(2, "0")}s
                              </span>
                            );
                          }
                          return `${Math.ceil(sec / 60)}min`;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Aporte: ${strat.positionSize || strat.tradeSize} USDT
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleAumentar(strat)}
                        className="rounded-lg bg-indigo-600/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        + Aporte
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => confirmarFechar(strat)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                      >
                        <Power className="h-3 w-3" aria-hidden="true" /> Encerrar
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => confirmarVoid(strat)}
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-50"
                        title="Encerrar pela corretora"
                        aria-label="Encerrar pela corretora"
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {/* Aba: Monitorando */}
      {aba === "monitored" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monitorando.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma estratégia em modo de monitoramento.
            </div>
          ) : (
            monitorando.map((strat) => (
              <div
                key={strat.id || strat.slug}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-bold text-white">
                    {strat.nome || strat.slug}
                  </span>
                  <button
                    type="button"
                    onClick={() => confirmarExcluir(strat)}
                    className="text-slate-500 transition-colors hover:text-rose-400"
                    title="Excluir estratégia"
                    aria-label="Excluir estratégia"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">{strat.slug}</div>
                <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <span className="font-mono text-slate-300">
                    Prob YES:{" "}
                    <b className="text-emerald-400 font-bold">
                      {strat.yesPrice > 0 ? `${(strat.yesPrice * 100).toFixed(1)}%` : "—"}
                    </b>
                  </span>
                  <span className="font-mono text-slate-300">
                    Prob NO:{" "}
                    <b className="text-indigo-400 font-bold">
                      {strat.noPrice > 0 ? `${(strat.noPrice * 100).toFixed(1)}%` : "—"}
                    </b>
                  </span>
                  <span className="font-mono text-slate-300">
                    Bid/Ask:{" "}
                    <b className="text-white">
                      {strat.bestBid.toFixed(3)}/{strat.bestAsk.toFixed(3)}
                    </b>
                  </span>
                  <span className="font-mono text-slate-300">
                    Var 1h:{" "}
                    <b
                      className={
                        strat.oneHourPriceChange >= 0 ? "text-emerald-400" : "text-rose-400"
                      }
                    >
                      {strat.oneHourPriceChange !== 0
                        ? fmtPct(strat.oneHourPriceChange * 100)
                        : "—"}
                    </b>
                  </span>
                  <span className="font-mono text-slate-300">
                    Vol 24h:{" "}
                    <b className="text-white">
                      ${strat.volume24hr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </b>
                  </span>
                  <span className="font-mono text-slate-300">
                    Vence:{" "}
                    <b className="text-white">
                      {(() => {
                        const sec = getRemainingSeconds(strat, nowMs);
                        if (sec <= 0)
                          return <span className="text-rose-400 font-bold">Vencido</span>;
                        if (sec <= 180) {
                          return (
                            <span className="text-amber-400 font-bold">
                              {Math.floor(sec / 60)}m {String(sec % 60).padStart(2, "0")}s
                            </span>
                          );
                        }
                        return `${Math.ceil(sec / 60)}min`;
                      })()}
                    </b>
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1 rounded bg-slate-900/60 p-1.5 text-center font-mono text-[10px] border border-white/5">
                  <div title="Variação de probabilidade nos últimos 30 segundos">
                    <span className="text-slate-400 block text-[9px] uppercase">Vel. 30s</span>
                    <b
                      className={
                        strat.probVelocity30s > 0
                          ? "text-emerald-400 font-bold"
                          : strat.probVelocity30s < 0
                            ? "text-rose-400 font-bold"
                            : "text-slate-300"
                      }
                    >
                      {strat.probVelocity30s > 0
                        ? `+${(strat.probVelocity30s * 100).toFixed(1)}%`
                        : `${(strat.probVelocity30s * 100).toFixed(1)}%`}
                    </b>
                  </div>
                  <div title="Volatilidade da cotação nos últimos 60 segundos">
                    <span className="text-slate-400 block text-[9px] uppercase">Vol. 60s</span>
                    <b className="text-cyan-300 font-bold">
                      {(strat.probVolatility60s * 100).toFixed(1)}%
                    </b>
                  </div>
                  <div title="Taxa de drenagem do Ask do CLOB (consumo de cotas/seg)">
                    <span className="text-slate-400 block text-[9px] uppercase">Drenagem</span>
                    <b className="text-amber-400 font-bold">
                      {strat.askDepletionRate.toFixed(1)} sh/s
                    </b>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                  <span className="font-mono text-slate-300">Aporte: ${strat.tradeSize}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Spread: {fmtPct(strat.spreadPct)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Aba: Histórico de Trades */}
      {aba === "closed" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/80 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Intervalo:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {INTERVALOS_FILTRO.map((btn) => (
                <button
                  key={btn.id}
                  disabled={carregandoTrades}
                  onClick={() => carregarPeriodo(btn.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    periodo === btn.id
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {carregandoTrades ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-10 text-center text-xs text-slate-400">
              Carregando operações do período...
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {encerradas.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
                  <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
                  Nenhuma operação encontrada para o período selecionado.
                </div>
              ) : (
                encerradas.map((t, idx) => (
                  <div
                    key={t.id || `${t.slug}-${idx}`}
                    className={`rounded-xl border p-4 transition-colors ${
                      t.pnl > 0
                        ? "border-emerald-500/20 bg-emerald-950/30 hover:bg-emerald-950/40"
                        : t.pnl < 0
                          ? "border-rose-500/20 bg-rose-950/30 hover:bg-rose-950/40"
                          : "border-white/10 bg-slate-950/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{t.question || t.slug}</h4>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-400">
                          {t.reason.includes("venda-antecipada") ? (
                            <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                              Venda Antecipada (Saída Prévias)
                            </span>
                          ) : t.reason.includes("redeem-vencimento") ? (
                            <span className="inline-flex items-center rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                              Vencimento (Resgate Total)
                            </span>
                          ) : (
                            <span>
                              {t.type === "close_pair"
                                ? "Encerrada"
                                : t.type === "mm_quote"
                                  ? t.orderIds.length > 0
                                    ? "Cotação MM (ordem enviada)"
                                    : "Cotação MM (sem ordem)"
                                  : "Aberta"}
                            </span>
                          )}{" "}
                          <span>| {new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div
                        className={`text-right font-mono text-base font-black ${
                          t.pnl > 0
                            ? "text-emerald-400"
                            : t.pnl < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                        }`}
                      >
                        {fmtUsd(t.pnl)}
                        {t.investedUsd > 0 ? (
                          <span className="ml-1.5 text-xs font-semibold">
                            ({t.pnl > 0 ? "+" : ""}
                            {((t.pnl / t.investedUsd) * 100).toFixed(2)}%)
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Entrada
                        </span>
                        <div className="mt-0.5 font-mono font-semibold text-slate-300">
                          {t.openedAt
                            ? new Date(t.openedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Encerramento
                        </span>
                        <div className="mt-0.5 font-mono font-semibold text-slate-300">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Duração
                        </span>
                        <div className="mt-0.5 font-mono font-bold text-amber-400">
                          {(() => {
                            if (!t.openedAt || !t.createdAt) return "—";
                            const diffSec = Math.max(
                              0,
                              Math.floor(
                                (new Date(t.createdAt).getTime() - new Date(t.openedAt).getTime()) /
                                  1000,
                              ),
                            );
                            const m = Math.floor(diffSec / 60);
                            const s = diffSec % 60;
                            return m > 0 ? `${m}m ${s}s` : `${s}s`;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Investido
                        </span>
                        <div className="mt-0.5 font-mono font-bold text-white">
                          ${t.investedUsd.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Realizado
                        </span>
                        <div className="mt-0.5 font-mono font-bold text-slate-300">
                          ${t.realizedUsd.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500">P/L</span>
                        <div
                          className={`mt-0.5 font-mono font-bold ${
                            t.pnl > 0
                              ? "text-emerald-400"
                              : t.pnl < 0
                                ? "text-rose-400"
                                : "text-slate-400"
                          }`}
                        >
                          {fmtUsd(t.pnl)}
                          {t.investedUsd > 0 ? (
                            <span className="ml-1 text-[10px] opacity-90">
                              ({t.pnl > 0 ? "+" : ""}
                              {((t.pnl / t.investedUsd) * 100).toFixed(2)}%)
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {t.reason ? (
                      <div className="mt-2 text-[10px] text-slate-600">{t.reason}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Aba: Lucro/Prejuízo por Ativo */}
      {aba === "performance" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Clock className="h-4 w-4 text-cyan-400" />
                Intervalo:
              </span>
              {INTERVALOS_FILTRO.map((p) => {
                const isSelected = perfPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPerfPeriod(p.id);
                      void consultarPerformance(p.id);
                    }}
                    disabled={loadingPerf}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => consultarPerformance(perfPeriod)}
              disabled={loadingPerf}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/30 transition-all hover:bg-cyan-500 disabled:opacity-50"
            >
              <Search className={`h-3.5 w-3.5 ${loadingPerf ? "animate-spin" : ""}`} />
              {loadingPerf ? "Consultando..." : "Consultar Agora"}
            </button>
          </div>

          {loadingPerf ? (
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-12 text-center text-sm font-semibold text-cyan-400">
              Carregando dados consolidados por mercado Polymarket...
            </div>
          ) : !perfConsulted ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/70 p-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-cyan-400 opacity-60" />
              <h3 className="mt-3 text-base font-bold text-white">Consulta sob Demanda</h3>
              <p className="mt-1 text-xs text-slate-400">
                Selecione o intervalo de tempo acima e clique em Consultar para analisar os lucros e
                prejuízos por mercado Polymarket.
              </p>
            </div>
          ) : (
            (() => {
              const closedPerfTrades = perfTrades.filter(
                (t) =>
                  t.type === "close_pair" ||
                  t.type === "close" ||
                  t.type === "settlement" ||
                  t.type === "voided" ||
                  t.status === "closed" ||
                  t.status === "executed" ||
                  t.status === "simulated" ||
                  t.pnl !== 0 ||
                  t.realizedUsd > 0,
              );

              if (closedPerfTrades.length === 0) {
                return (
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-12 text-center text-sm text-slate-400">
                    Nenhuma operação encerrada encontrada no período selecionado ({perfPeriod}).
                  </div>
                );
              }

              const coinMap = new Map<
                string,
                {
                  coin: string;
                  name: string;
                  totalTrades: number;
                  wins: number;
                  losses: number;
                  invested: number;
                  realized: number;
                  pnl: number;
                  markets: {
                    slug: string;
                    question: string;
                    pnl: number;
                    invested: number;
                    realized: number;
                    wins: number;
                    losses: number;
                  }[];
                }
              >();

              closedPerfTrades.forEach((t) => {
                const text = `${t.question || ""} ${t.slug || ""}`;
                const { coin, name } = getCoinDetails(text);
                const pnl = t.pnl || 0;
                const isWin = pnl > 0;
                const isLoss = pnl < 0;
                const invested = t.investedUsd || t.amount || 0;
                const realized = t.realizedUsd || 0;

                let entry = coinMap.get(coin);
                if (!entry) {
                  entry = {
                    coin,
                    name,
                    totalTrades: 0,
                    wins: 0,
                    losses: 0,
                    invested: 0,
                    realized: 0,
                    pnl: 0,
                    markets: [],
                  };
                  coinMap.set(coin, entry);
                }

                entry.totalTrades += 1;
                if (isWin) entry.wins += 1;
                else if (isLoss) entry.losses += 1;
                entry.invested += invested;
                entry.realized += realized;
                entry.pnl += pnl;

                const mSlug = t.slug || t.marketId || "mercado";
                let mItem = entry.markets.find((m) => m.slug === mSlug);
                if (!mItem) {
                  mItem = {
                    slug: mSlug,
                    question: t.question || t.slug || "Mercado",
                    pnl: 0,
                    invested: 0,
                    realized: 0,
                    wins: 0,
                    losses: 0,
                  };
                  entry.markets.push(mItem);
                }
                mItem.pnl += pnl;
                mItem.invested += invested;
                mItem.realized += realized;
                if (isWin) mItem.wins += 1;
                else if (isLoss) mItem.losses += 1;
              });

              const groupedCoins = Array.from(coinMap.values()).toSorted((a, b) => b.pnl - a.pnl);
              const totalPeriodPnl = groupedCoins.reduce((acc, i) => acc + i.pnl, 0);
              const totalPeriodTrades = groupedCoins.reduce((acc, i) => acc + i.totalTrades, 0);
              const totalPeriodWins = groupedCoins.reduce((acc, i) => acc + i.wins, 0);
              const totalPeriodLosses = groupedCoins.reduce((acc, i) => acc + i.losses, 0);
              const totalPeriodInvested = groupedCoins.reduce((acc, i) => acc + i.invested, 0);
              const totalPeriodRealized = groupedCoins.reduce((acc, i) => acc + i.realized, 0);
              const totalPeriodWinRate =
                totalPeriodTrades > 0 ? (totalPeriodWins / totalPeriodTrades) * 100 : 0;

              return (
                <div className="space-y-4">
                  {/* Resumo do Período */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        P/L do Período
                      </span>
                      <div
                        className={`mt-1 font-mono text-xl font-black ${
                          totalPeriodPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {fmtUsd(totalPeriodPnl)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Total de Trades
                      </span>
                      <div className="mt-1 font-mono text-xl font-black text-white">
                        {totalPeriodTrades} ({totalPeriodWins}W / {totalPeriodLosses}L)
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Taxa de Acerto (Win Rate)
                      </span>
                      <div className="mt-1 font-mono text-xl font-black text-cyan-400">
                        {totalPeriodWinRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Investido / Realizado
                      </span>
                      <div className="mt-1 font-mono text-sm font-bold text-slate-200">
                        ${totalPeriodInvested.toFixed(2)} /{" "}
                        <span className="text-emerald-400">${totalPeriodRealized.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Linha do Tempo de P/L por Ativo */}
                  <UniversalTimelineChart
                    title="Curva de Ganho e Perda na Linha do Tempo Polymarket (P/L Acumulado por Ativo)"
                    subtitle="Evolução cumulativa de resultados por criptoativo operado no período selecionado."
                    badgeColor="bg-cyan-400"
                    trades={closedPerfTrades.map((t) => {
                      const { coin } = getCoinDetails((t.question || "") + " " + (t.slug || ""));
                      return {
                        id: t.id,
                        symbol: coin,
                        pnl: t.pnl || 0,
                        status: t.status,
                        timestamp: new Date(t.createdAt || t.openedAt || 0).getTime(),
                      };
                    })}
                  />

                  {/* Tabela Agrupada por Moeda / Criptoativo */}
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 shadow-sm">
                    <div className="border-b border-white/10 bg-slate-900/80 px-4 py-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Performance Consolidada por Moeda (Criptoativo)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Moeda / Ativo</th>
                            <th className="px-4 py-3 text-center">Trades</th>
                            <th className="px-4 py-3 text-center">Vitórias</th>
                            <th className="px-4 py-3 text-center">Derrotas</th>
                            <th className="px-4 py-3 text-center">Win Rate</th>
                            <th className="px-4 py-3 text-right">Investido</th>
                            <th className="px-4 py-3 text-right">Realizado</th>
                            <th className="px-4 py-3 text-right">P/L Líquido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {groupedCoins.map((item) => {
                            const wr =
                              item.totalTrades > 0 ? (item.wins / item.totalTrades) * 100 : 0;
                            const isPositive = item.pnl >= 0;
                            return (
                              <tr
                                key={item.coin}
                                className="transition-colors hover:bg-slate-900/40"
                              >
                                <td className="px-4 py-3 font-sans" aria-label="Moeda / Ativo">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-cyan-500/20 px-2 py-1 text-xs font-black text-cyan-300 font-mono">
                                      {item.coin}
                                    </span>
                                    <div>
                                      <div className="font-bold text-white">{item.name}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {item.markets.length}{" "}
                                        {item.markets.length === 1 ? "mercado" : "mercados"}{" "}
                                        operados
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-300 font-bold">
                                  {item.totalTrades}
                                </td>
                                <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                                  {item.wins}
                                </td>
                                <td className="px-4 py-3 text-center text-rose-400 font-bold">
                                  {item.losses}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                                      wr >= 50
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-rose-500/20 text-rose-300"
                                    }`}
                                  >
                                    {wr.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-300">
                                  ${item.invested.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-300">
                                  ${item.realized.toFixed(2)}
                                </td>
                                <td
                                  className={`px-4 py-3 text-right font-black text-sm ${
                                    isPositive ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {fmtUsd(item.pnl)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Aba: IA Meta-Labeling (Gate 4) */}
      {aba === "aiStrategy" ? <PredictionAiStrategyView /> : null}
    </div>
  );
}
