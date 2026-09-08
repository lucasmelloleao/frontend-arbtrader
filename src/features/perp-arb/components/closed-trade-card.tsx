"use client";

import { useState } from "react";

import type { PerpArbTrade } from "@/features/perp-arb/perp-arb.schema";
import {
  FundingHarvestsDialog,
  type FundingHarvest,
} from "@/features/perp-arb/components/funding-harvests-dialog";

type ClosedTradeCardProps = {
  trade: PerpArbTrade;
  allTrades: readonly PerpArbTrade[];
};

function formatDuration(ms: number): string {
  if (ms <= 0) return "< 1s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

const fmtUsd = (valor: number): string =>
  valor >= 0 ? `+$${valor.toFixed(4)}` : `-$${Math.abs(valor).toFixed(4)}`;

const fmtP = (valor: number): string => (valor < 0.1 ? valor.toFixed(6) : valor.toFixed(4));

/**
 * Card de operação encerrada: entrada vs valor final, PnL por perna, funding
 * coletado no período, spread, duração e APR realizado. Server Component puro.
 */
export function ClosedTradeCard({ trade, allTrades }: ClosedTradeCardProps): React.ReactNode {
  const [showFunding, setShowFunding] = useState(false);
  const isClose = trade.type === "close_hedge";
  const pnlVal = trade.pnl;
  const isProfit = isClose && pnlVal >= 0;
  const amount = trade.amount;
  const pnlPct = amount > 0 ? (pnlVal / amount) * 100 : 0;

  // Trade de abertura correspondente
  const matchingOpenTrade = allTrades.find(
    (t) =>
      t.type === "open_hedge" &&
      (t.status === "executed" || t.status === "simulated") &&
      (t.strategyId === trade.strategyId || t.perpSymbol === trade.perpSymbol) &&
      new Date(t.createdAt).getTime() <= new Date(trade.createdAt).getTime(),
  );

  // Funding acumulado entre abertura e fechamento. O backend pode mandar o
  // total pronto (`fundingCollected` do close); senão soma os trades de funding.
  const openTime =
    matchingOpenTrade !== undefined ? new Date(matchingOpenTrade.createdAt).getTime() : 0;
  const closeTime = new Date(trade.createdAt).getTime();
  const fundingTrades = allTrades.filter(
    (t) =>
      t.type === "funding_fee_accumulated" &&
      (t.strategyId === trade.strategyId || t.perpSymbol === trade.perpSymbol) &&
      new Date(t.createdAt).getTime() >= openTime &&
      new Date(t.createdAt).getTime() <= closeTime,
  );
  const fundingCollected =
    trade.fundingCollected !== null
      ? trade.fundingCollected
      : fundingTrades.reduce((acc, t) => acc + t.pnl, 0);
  const fundingCount = fundingTrades.length;

  // Lista de colheitas do extrato (modal): uma entrada por trade de funding
  // acumulado no período da operação.
  const harvests: readonly FundingHarvest[] = fundingTrades.map((t) => ({
    amount: t.pnl,
    timestamp: t.createdAt,
    fundingRate: t.fundingRate,
  }));

  // Entrada: preço do trade de abertura (ou do próprio close quando o shape
  // legado gravava os preços de entrada no close). Saída: campos novos do
  // backend (`spotExitPrice`/`perpExitPrice`); fallback pro `spotPrice`/
  // `perpPrice` do close (shape antigo) ou pro preço do trade de abertura.
  const openSpotPrice = matchingOpenTrade?.spotPrice ?? trade.spotPrice;
  const openPerpPrice = matchingOpenTrade?.perpPrice ?? trade.perpPrice;
  const closeSpotPrice = trade.spotExitPrice ?? trade.spotPrice;
  const closePerpPrice = trade.perpExitPrice ?? trade.perpPrice;

  // Unidades reais negociadas: prioriza as quantidades exatas que o backend
  // registra da corretora (`spotQuantity`/`perpQuantity`); senão deriva do
  // notional/preço (aproximação legada).
  const spotUnits =
    matchingOpenTrade?.spotQuantity !== null && matchingOpenTrade?.spotQuantity !== undefined
      ? matchingOpenTrade.spotQuantity
      : openSpotPrice > 0
        ? amount / openSpotPrice
        : 0;
  const rawPerpUnits =
    matchingOpenTrade?.perpQuantity !== null &&
    matchingOpenTrade?.perpQuantity !== undefined &&
    matchingOpenTrade.perpQuantity > 0
      ? matchingOpenTrade.perpQuantity
      : 0;
  const expectedPerpNotional = amount;
  const perpNotionalFromQty = rawPerpUnits * openPerpPrice;
  const isPerpQtyBaseUnits =
    rawPerpUnits > 0 &&
    expectedPerpNotional > 0 &&
    Math.abs(perpNotionalFromQty - expectedPerpNotional) / expectedPerpNotional < 0.5;
  const perpUnits = isPerpQtyBaseUnits
    ? rawPerpUnits
    : openPerpPrice > 0
      ? amount / openPerpPrice
      : 0;
  const spotPnL =
    trade.spotPnl !== null
      ? trade.spotPnl
      : spotUnits > 0 && closeSpotPrice > 0
        ? (closeSpotPrice - openSpotPrice) * spotUnits
        : null;
  const perpPnL =
    trade.perpPnl !== null
      ? trade.perpPnl
      : perpUnits > 0 && closePerpPrice > 0
        ? (openPerpPrice - closePerpPrice) * perpUnits
        : null;

  const openedAtRaw = trade.openedAt ?? matchingOpenTrade?.createdAt ?? null;
  const openTimeMs = openedAtRaw !== null ? new Date(openedAtRaw).getTime() : 0;
  const durationMs = openTimeMs > 0 ? Math.max(0, closeTime - openTimeMs) : 0;
  const durationHours = durationMs > 0 ? durationMs / 3600000 : 0;
  const computedGrossPnl = (spotPnL ?? 0) + (perpPnL ?? 0) + fundingCollected;
  const feesVal = trade.tradingFees ?? (amount * 0.0036);
  const netPnlVal = trade.netPnl !== null && trade.netPnl !== undefined 
    ? trade.netPnl 
    : (computedGrossPnl - feesVal);

  const isNetProfit = isClose && netPnlVal >= 0;
  const netPnlPct = amount > 0 ? (netPnlVal / amount) * 100 : 0;
  const realizedApr =
    amount > 0 && durationHours >= 0.01 ? (netPnlVal / amount) * (8760 / durationHours) * 100 : null;

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border p-5 shadow-lg ${
        isClose
          ? isNetProfit
            ? "border-emerald-500/40 bg-emerald-950/20"
            : "border-red-500/40 bg-red-950/20"
          : "border-indigo-500/30 bg-slate-900"
      }`}
    >
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {trade.strategyName || trade.perpSymbol}
            </h3>
            <div className="font-mono text-xs text-indigo-300">
              {trade.perpSymbol} / {trade.spotSymbol}
            </div>
          </div>
          {durationMs > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300">
              ⏱️ {formatDuration(durationMs)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              💵 Valor de Entrada
            </span>
            <div className="mt-1 text-xl font-black text-white sm:text-2xl">
              ${amount.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
            </div>
            {spotUnits > 0 ? (
              <span className="mt-1 font-mono text-[11px] text-slate-400">
                {spotUnits.toFixed(2)} base
              </span>
            ) : null}
          </div>
          <div
            className={`flex flex-col justify-between rounded-xl border p-3.5 ${
              isNetProfit
                ? "border-emerald-500/40 bg-emerald-950/25"
                : "border-red-500/40 bg-red-950/25"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              🏁 Valor Final Real
            </span>
            <div className="mt-1 text-xl font-black text-white sm:text-2xl">
              ${(amount + netPnlVal).toFixed(2)}{" "}
              <span className="text-xs font-normal text-slate-400">USDT</span>
            </div>
            {isClose ? (
              <div
                className={`mt-1 text-xs font-extrabold ${isNetProfit ? "text-emerald-400" : "text-red-400"}`}
              >
                {isNetProfit ? "+" : ""}${netPnlVal.toFixed(4)} ({isNetProfit ? "+" : ""}
                {netPnlPct.toFixed(2)}%)
              </div>
            ) : (
              <span className="mt-1 font-mono text-xs text-slate-400">Concluído</span>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-slate-950/90 p-3 text-xs">
          <div className="flex justify-between border-b border-white/5 pb-1 font-semibold text-slate-300">
            <span>Preços (Entrada → Saída) &amp; Resultados:</span>
            <span className="text-[10px] font-normal text-gray-400">Hedge 1X</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                Spot (LONG)
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                ${fmtP(openSpotPrice)} → ${fmtP(closeSpotPrice)}
              </span>
            </div>
            <div
              className={`font-mono font-bold ${spotPnL !== null && spotPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {spotPnL !== null ? fmtUsd(spotPnL) : "—"}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="rounded border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                Perpétuo (SHORT)
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                ${fmtP(openPerpPrice)} → ${fmtP(closePerpPrice)}
              </span>
            </div>
            <div
              className={`font-mono font-bold ${perpPnL !== null && perpPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {perpPnL !== null ? fmtUsd(perpPnL) : "—"}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
            <button
              type="button"
              onClick={() => setShowFunding(true)}
              disabled={fundingCount === 0}
              className="inline-flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 transition-colors hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              title={fundingCount > 0 ? "Ver extrato de colheitas" : "Sem colheitas registradas"}
            >
              🌾 Funding Coletado (
              {fundingCount > 0
                ? `${fundingCount} ${fundingCount === 1 ? "colheita" : "colheitas"}`
                : "Acumulado"}
              )
            </button>
            <span className="font-mono font-bold text-cyan-300">
              +{fundingCollected.toFixed(4)} USDT
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
            <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300" title="Taxas de Corretagem (Taker Fees Spot + Perp)">
              💸 Taxas da Corretora
            </span>
            <span className="font-mono font-bold text-amber-300">
              -${(trade.tradingFees ?? (amount * 0.0036)).toFixed(4)} USDT
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs font-black">
            <span className="uppercase text-slate-200">
              🎯 Lucro Líquido Real:
            </span>
            <span className={`font-mono ${((trade.netPnl ?? (pnlVal - (amount * 0.0036))) >= 0) ? "text-emerald-400" : "text-red-400"}`}>
              {fmtUsd(trade.netPnl ?? (pnlVal - (amount * 0.0036)))} USDT
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2.5 text-xs text-gray-400">
          {openedAtRaw !== null ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">🚀 Abertura:</span>
              <span className="font-mono font-medium text-slate-200">
                {new Date(openedAtRaw).toLocaleString()}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🏁 Encerramento:</span>
            <span className="font-mono font-medium text-slate-200">
              {new Date(trade.createdAt).toLocaleString()}
            </span>
          </div>
          {durationMs > 0 ? (
            <div className="flex items-center justify-between border-t border-white/5 pt-1 text-[11px]">
              <span className="font-semibold text-indigo-300">⏱️ Tempo em Aberto:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-300">
                  {formatDuration(durationMs)}
                </span>
                {realizedApr !== null && realizedApr > 0 ? (
                  <span className="rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                    📈 APR Realizado: +{realizedApr.toFixed(1)}% a.a.
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          {trade.reason ? (
            <div className="flex items-center justify-between border-t border-white/5 pt-1 text-[11px]">
              <span className="font-semibold text-amber-300">📌 Motivo do Encerramento:</span>
              <span className="font-mono font-bold text-amber-200">{trade.reason}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal de extrato de colheitas de funding */}
      {showFunding ? (
        <FundingHarvestsDialog harvests={harvests} onClose={() => setShowFunding(false)} />
      ) : null}
    </div>
  );
}
