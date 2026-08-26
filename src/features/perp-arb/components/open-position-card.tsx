"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Power, RefreshCw, XCircle } from "lucide-react";

import {
  aumentarAporte,
  fecharStrategy,
  voidCloseStrategy,
} from "@/features/perp-arb/perp-arb.actions";
import type { PerpArbStrategy, PerpArbTrade } from "@/features/perp-arb/perp-arb.schema";

/** Posição futura ao vivo (shape do `/portfolio/live`). */
type LivePosition = {
  symbol: string;
  entryPrice: number | null;
  markPrice: number | null;
  bidPrice: number | null;
  askPrice: number | null;
  liquidationPrice: number | null;
  leverage: number;
};

/** Moeda spot ao vivo (shape do `/portfolio/live`). */
type LiveSpotCoin = {
  asset: string;
  price: number | null;
  bidPrice: number | null;
  askPrice: number | null;
};

type OpenPositionCardProps = {
  strategy: PerpArbStrategy;
  trades: readonly PerpArbTrade[];
  livePositions: readonly LivePosition[];
  liveSpotCoins: readonly LiveSpotCoin[];
};

function formatElapsed(openedAt: string): string {
  const diff = Math.max(0, Date.now() - new Date(openedAt).getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/** Contagem regressiva para o próximo funding (epochs de 4h). */
function FundingCountdown(): React.ReactNode {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = (): void => {
      const now = new Date();
      const nextFunding = new Date(now);
      const nextEpochHour = (Math.floor(now.getUTCHours() / 4) + 1) * 4;
      nextFunding.setUTCHours(nextEpochHour, 0, 0, 0);
      let diff = nextFunding.getTime() - now.getTime();
      if (diff <= 0) diff += 4 * 3600 * 1000;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono font-bold text-cyan-300">{timeLeft}</span>;
}

const fmtUsd = (valor: number): string =>
  valor >= 0 ? `+$${valor.toFixed(4)}` : `-$${Math.abs(valor).toFixed(4)}`;

const fmtP = (valor: number): string => (valor < 0.1 ? valor.toFixed(6) : valor.toFixed(4));

/**
 * Card de posição aberta: valor de entrada, retorno líquido estimado (com
 * spread e taxas), PnL por perna (Spot LONG + Perp SHORT), funding coletado,
 * próximo funding, APR e ações (aumentar aporte, encerrar, encerrada pela
 * corretora).
 */
export function OpenPositionCard({
  strategy: s,
  trades,
  livePositions,
  liveSpotCoins,
}: OpenPositionCardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showIncrease, setShowIncrease] = useState(false);
  const [amount, setAmount] = useState("50");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (showIncrease && dialogRef.current !== null && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [showIncrease]);

  // Posição futura real (live) para o par
  const livePos = livePositions.find((lp) => {
    const lpSym = lp.symbol.toLowerCase();
    const perpSym = s.perpSymbol.toLowerCase();
    return lpSym === perpSym || lpSym.replace("/usdt:usdt", "/usdt") === perpSym;
  });

  // Moeda spot real (live) para a base do par
  const spotBase = s.spotSymbol.split("/")[0] ?? "";
  const spotCoin = liveSpotCoins.find((c) => c.asset.toUpperCase() === spotBase.toUpperCase());

  // Trade de abertura mais recente DESTA estratégia (filtra por id/símbolo — o
  // trade de outro par não pode virar a "entrada" deste).
  const stratTrades = trades.filter((t) => t.strategyId === s.id || t.perpSymbol === s.perpSymbol);
  const openTrade = stratTrades
    .filter((t) => t.type === "open_hedge" && (t.status === "executed" || t.status === "simulated"))
    .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .at(0);

  const openedAt = s.positionOpenedAt ?? (openTrade === undefined ? "" : openTrade.createdAt);
  const elapsedStr = formatElapsed(openedAt);

  // Entrada FIXA da posição: prioriza o trade de abertura (preço histórico de
  // execução); senão o preço ao vivo da corretora; por último o valor gravado.
  const entrySpot =
    openTrade !== undefined && openTrade.spotPrice > 0
      ? openTrade.spotPrice
      : livePos !== undefined && livePos.entryPrice !== null && livePos.entryPrice > 0
        ? livePos.entryPrice
        : (s.lastSpotPrice ?? 0);
  const entryPerp =
    openTrade !== undefined && openTrade.perpPrice > 0
      ? openTrade.perpPrice
      : livePos !== undefined && livePos.entryPrice !== null && livePos.entryPrice > 0
        ? livePos.entryPrice
        : (s.lastPerpPrice ?? 0);
  const positionSize =
    s.positionSize > 0
      ? s.positionSize
      : openTrade === undefined
        ? s.tradeSize
        : openTrade.amount || s.tradeSize;

  // Saída ao vivo: Spot (LONG) usa o BID do livro SPOT (venda no livro), Perp
  // (SHORT) usa o ASK da posição perp (recompra do short). Sem o livro, cai pro
  // preço médio/mark.
  const spotCoinBid =
    spotCoin !== undefined && spotCoin.bidPrice !== null && spotCoin.bidPrice > 0
      ? spotCoin.bidPrice
      : 0;
  const livePerpAsk =
    livePos !== undefined && livePos.askPrice !== null && livePos.askPrice > 0
      ? livePos.askPrice
      : 0;
  const exitSpotPrice =
    spotCoinBid > 0
      ? spotCoinBid
      : spotCoin !== undefined && spotCoin.price !== null && spotCoin.price > 0
        ? spotCoin.price
        : entrySpot;
  const liveMark =
    livePos !== undefined && livePos.markPrice !== null && livePos.markPrice > 0
      ? livePos.markPrice
      : 0;
  const exitPerpPrice = livePerpAsk > 0 ? livePerpAsk : liveMark || entryPerp;

  // Preço de liquidação estimado: prioriza o campo do backend; senão estima
  // Short 1X como EntryPrice * 2 (como o backend descreve).
  const liquidationPrice =
    s.estimatedLiquidationPrice !== null
      ? s.estimatedLiquidationPrice
      : livePos !== undefined && livePos.liquidationPrice !== null && livePos.liquidationPrice > 0
        ? livePos.liquidationPrice
        : entryPerp > 0
          ? entryPerp * 2
          : null;

  // Spread real de saída: prioriza o campo do backend; senão calcula do livro
  // (spotBid vs perpAsk) quando os dois existem.
  const exitSpreadPct =
    s.exitSpreadPct !== null
      ? s.exitSpreadPct
      : exitSpotPrice > 0 && exitPerpPrice > 0
        ? ((exitPerpPrice - exitSpotPrice) / exitSpotPrice) * 100
        : null;
  const exitSpreadUsd =
    s.exitSpreadUsd !== null
      ? s.exitSpreadUsd
      : exitSpreadPct !== null && positionSize > 0
        ? (exitSpreadPct / 100) * positionSize
        : null;

  // Funding rate na abertura (campo novo do backend; fallback pro trade).
  const fundingAtOpen =
    s.fundingAtOpen !== null
      ? s.fundingAtOpen
      : openTrade !== undefined
        ? openTrade.fundingRate
        : null;

  const spotUnits = entrySpot > 0 ? positionSize / entrySpot : 0;
  const perpUnits = entryPerp > 0 ? positionSize / entryPerp : 0;
  const spotPnL = spotUnits > 0 && exitSpotPrice > 0 ? (exitSpotPrice - entrySpot) * spotUnits : 0;
  const perpPnL = perpUnits > 0 && exitPerpPrice > 0 ? (entryPerp - exitPerpPrice) * perpUnits : 0;
  const marketPnL = spotPnL + perpPnL;

  // Funding coletado: prioriza o history da estratégia; senão soma os trades
  // de `funding_fee_accumulated` desta estratégia (a partir da abertura).
  const openedTime = new Date(openedAt).getTime();
  const fundingTrades = stratTrades.filter((t) => {
    if (t.type !== "funding_fee_accumulated") return false;
    if (openedTime > 0) return new Date(t.createdAt).getTime() >= openedTime;
    return true;
  });
  const rawFundingHistory = s.fundingHistory;
  const filteredFundingHistory = rawFundingHistory.filter((h) => {
    if (openedTime <= 0) return true;
    const ts = new Date(h.timestamp).getTime();
    return Number.isFinite(ts) && ts >= openedTime;
  });

  const historyTotal =
    filteredFundingHistory.length > 0
      ? filteredFundingHistory.reduce((acc, h) => acc + h.amount, 0)
      : 0;
  const tradeTotal = fundingTrades.reduce((acc, t) => acc + t.pnl, 0);
  const fundingCollected = filteredFundingHistory.length > 0 ? historyTotal : tradeTotal;
  const fundingHistoryList =
    filteredFundingHistory.length > 0
      ? filteredFundingHistory
      : fundingTrades.flatMap((t) => [
          { amount: t.pnl, timestamp: t.createdAt, fundingRate: t.fundingRate },
        ]);
  const fundingCount = fundingHistoryList.length;

  const estimatedTradingFees = positionSize * 0.0012;
  const totalUnrealizedPnL = marketPnL + fundingCollected;
  const netProfitPostFees = totalUnrealizedPnL - estimatedTradingFees;
  const unrealizedPct = positionSize > 0 ? (totalUnrealizedPnL / positionSize) * 100 : 0;

  const currentFundingVal = s.currentFundingRate;
  const currentApr = (currentFundingVal ?? 0) * 3 * 365;

  const executar = (acao: () => Promise<{ ok: boolean }>): void => {
    startTransition(async () => {
      await acao();
      router.refresh();
    });
  };

  const confirmarFechar = (): void => {
    if (
      !confirm(
        `Encerrar a posição de "${s.nome}" agora? O robô fechará o Spot (Venda) e Perpétuo (Recompra Short) a mercado.`,
      )
    ) {
      return;
    }
    executar(() => fecharStrategy(s.id, s.perpSymbol));
  };

  const confirmarVoid = (): void => {
    if (
      !confirm(
        `Marcar "${s.nome}" como encerrada pela corretora? Nenhuma ordem será enviada e o PnL será zero.`,
      )
    ) {
      return;
    }
    executar(() => voidCloseStrategy(s.id, s.perpSymbol));
  };

  const confirmarAporte = (): void => {
    const valor = Number(amount);
    if (!valor || valor <= 0) {
      alert("Informe um valor válido em USDT.");
      return;
    }
    executar(() => aumentarAporte(s.id, valor));
    setShowIncrease(false);
    setAmount("50");
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-slate-950 p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
            {s.nome}
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            {s.perpSymbol} / {s.spotSymbol}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300">
            ⏱️ Aberto há {elapsedStr}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowIncrease(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-105 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            title="Aumentar aporte da posição comprando Spot e Short Perpétuo"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> + Aumentar Aporte
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={confirmarFechar}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-105 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            title="Encerrar posição a mercado imediatamente"
          >
            <Power className="h-3.5 w-3.5" aria-hidden="true" /> Encerrar Agora
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={confirmarVoid}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-700/80 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:scale-105 hover:bg-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Marcar como encerrada pela corretora (sem executar ordens)"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Encerrada pela Corretora
          </button>
        </div>
      </div>

      {/* Entrada vs Retorno Líquido */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            💵 Valor de Entrada
          </span>
          <div className="mt-1 text-xl font-black text-white sm:text-2xl">
            ${positionSize.toFixed(2)}{" "}
            <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          {entrySpot > 0 ? (
            <span className="mt-1 font-mono text-[11px] text-slate-400">
              ~{(positionSize / entrySpot).toFixed(2)} base
            </span>
          ) : null}
        </div>
        <div
          className={`flex flex-col justify-between rounded-xl border p-3.5 ${
            netProfitPostFees >= 0
              ? "border-emerald-500/40 bg-emerald-950/25"
              : "border-red-500/40 bg-red-950/25"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            🏁 Retorno Líquido Estimado
          </span>
          <div className="mt-1 text-xl font-black text-white sm:text-2xl">
            ${(positionSize + netProfitPostFees).toFixed(2)}{" "}
            <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          <div className="mt-1 flex flex-col">
            <span
              className={`text-xs font-extrabold ${netProfitPostFees >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {netProfitPostFees >= 0 ? "+" : ""}${netProfitPostFees.toFixed(4)} (
              {netProfitPostFees >= 0 ? "+" : ""}
              {unrealizedPct.toFixed(2)}%)
            </span>
            <span className="text-[10px] text-slate-400">
              Já descontado: spread (Bid/Ask) + taxas de ordem
            </span>
          </div>
        </div>
      </div>

      {/* Break-even */}
      {netProfitPostFees < 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] font-medium text-amber-300">
          <span>
            ⏳ Faltam +${Math.abs(netProfitPostFees).toFixed(4)} USDT p/ cobrir taxas de ordem
          </span>
          <span className="font-bold text-amber-400">Aguardando Funding</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px] font-medium text-emerald-300">
          <span>✅ Lucro Real Garantido! Taxas de ordem já cobertas</span>
          <span className="font-bold text-emerald-400">Pronto p/ Lucrar</span>
        </div>
      )}

      {/* PnL por perna */}
      <div className="mt-3 space-y-2.5 rounded-lg border border-white/10 bg-slate-900/90 p-3.5 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-semibold text-slate-200">
          <span>📊 PnL por Perna &amp; Diferença Liquida</span>
          <span className="rounded border border-indigo-500/30 bg-indigo-950/60 px-2 py-0.5 text-[10px] text-indigo-300">
            Hedge 1X (Delta Neutro)
          </span>
        </div>
        <div className="flex items-center justify-between rounded border border-emerald-500/20 bg-slate-950/60 p-2">
          <div className="flex flex-col gap-0.5">
            <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
              Spot (LONG)
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Entrada: ${fmtP(entrySpot)} → Atual (Bid): ${fmtP(exitSpotPrice)}
            </span>
          </div>
          <div
            className={`font-mono text-sm font-bold ${spotPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {fmtUsd(spotPnL)} USDT
          </div>
        </div>
        <div className="flex items-center justify-between rounded border border-purple-500/20 bg-slate-950/60 p-2">
          <div className="flex flex-col gap-0.5">
            <span className="rounded border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
              Perpétuo (SHORT)
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Entrada: ${fmtP(entryPerp)} → Atual (Ask/Mark): ${fmtP(exitPerpPrice)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`font-mono text-sm font-bold ${perpPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fmtUsd(perpPnL)} USDT
            </span>
            <span className="text-[10px] text-slate-500">PnL Futuro (Não Realizado)</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded border border-indigo-500/30 bg-indigo-950/30 p-2 font-mono">
          <span className="font-sans text-[11px] font-medium text-indigo-200">
            ⚖️ Soma/Diferença das Pernas (Spot + Futuro):
          </span>
          <span className={`font-bold ${marketPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {fmtUsd(marketPnL)} USDT
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
          <span className="rounded border border-cyan-500/30 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
            🌾 Funding Coletado (
            {fundingCount > 0
              ? `${fundingCount} ${fundingCount === 1 ? "colheita" : "colheitas"}`
              : "Acumulado"}
            )
          </span>
          <span className="flex items-center gap-1 font-mono font-bold text-cyan-300">
            <span className="text-[10px] font-normal text-slate-500">Pagamento Corretora</span>
            +${fundingCollected.toFixed(4)} USDT
          </span>
        </div>
      </div>

      {/* Métricas avançadas */}
      <div className="mt-3 space-y-2 rounded-lg border border-indigo-500/20 bg-slate-900/60 p-3 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>⏱️ Próximo Funding:</span>
          <FundingCountdown />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Retorno Anualizado (APR):</span>
          <span className="font-mono font-bold text-emerald-400">
            +{currentApr.toFixed(1)}% a.a.
          </span>
        </div>
        {exitSpreadPct !== null && exitSpreadUsd !== null ? (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Spread Real de Saída:</span>
            <span className="font-mono font-bold text-amber-300">
              {exitSpreadPct.toFixed(3)}% (${exitSpreadUsd >= 0 ? "+" : ""}
              {exitSpreadUsd.toFixed(4)} USDT)
            </span>
          </div>
        ) : null}
        {liquidationPrice !== null ? (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">🛡️ Preço Liq. Est. (Short 1X):</span>
            <span className="font-mono font-bold text-slate-300">
              ${liquidationPrice.toFixed(4)}{" "}
              <span className="text-[10px] font-normal text-slate-500">
                (~{Math.max(0, Math.min(100, (1 - entryPerp / liquidationPrice) * 100)).toFixed(0)}%
                margem seg.)
              </span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="mt-3 grid gap-2 border-t border-white/5 pt-2 font-sans text-xs text-gray-300 sm:grid-cols-2">
        <div>
          🚀 Aberto em:{" "}
          <span className="font-medium text-slate-300">
            {openedAt ? new Date(openedAt).toLocaleString() : "Recentemente"}
          </span>
        </div>
        <div>
          📊 Funding Rate Atual:{" "}
          <span className="font-semibold text-emerald-400">
            {currentFundingVal !== null ? `${currentFundingVal.toFixed(4)}%` : "—"}
          </span>
        </div>
        {fundingAtOpen !== null ? (
          <div>
            🌾 Funding Abertura:{" "}
            <span className="font-semibold text-cyan-300">{fundingAtOpen.toFixed(4)}%</span>
          </div>
        ) : null}
      </div>

      {/* Modal de aumento de aporte */}
      <dialog
        ref={dialogRef}
        onClose={() => setShowIncrease(false)}
        className="m-auto w-full max-w-md rounded-xl border border-indigo-500/40 bg-slate-950 p-6 text-slate-200 shadow-2xl backdrop:bg-black/70"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Aumentar Posição (Hedge)</h3>
            <p className="text-xs text-slate-400">{s.nome}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowIncrease(false)}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5 rounded-lg border border-white/5 bg-slate-900/80 p-3 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Posição Atual:</span>
              <span className="font-bold text-white">${positionSize.toFixed(2)} USDT</span>
            </div>
          </div>
          <div>
            <label
              htmlFor="increase-amount"
              className="mb-1.5 block text-xs font-semibold text-slate-300"
            >
              Aporte Adicional (USDT)
            </label>
            <input
              id="increase-amount"
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-indigo-500/30 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-indigo-400"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 100, 200].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(String(val))}
                className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${
                  amount === String(val)
                    ? "border-indigo-400 bg-indigo-600/30 text-white"
                    : "border-white/10 bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                +${val}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowIncrease(false)}
              className="w-1/2 rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarAporte}
              disabled={isPending}
              className="w-1/2 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? "Processando..." : "+ Aumentar Aporte"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
