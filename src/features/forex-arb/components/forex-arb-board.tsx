"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Activity, Lock, Plus, Power, Trash2, TrendingUp, X, XCircle } from "lucide-react";

import { ForexStrategyForm } from "@/features/forex-arb/components/forex-strategy-form";
import {
  deletarStrategy,
  deletarTodasOperacoes,
  fecharPosicao,
  fecharTodasPosicoes,
  voidClosePosicao,
} from "@/features/forex-arb/forex-arb.actions";
import type {
  ForexArbLeg,
  ForexArbStrategy,
  ForexArbTrade,
} from "@/features/forex-arb/forex-arb.schema";

type ForexArbBoardProps = {
  strategies: readonly ForexArbStrategy[];
  trades: readonly ForexArbTrade[];
  opportunities: readonly ForexArbTrade[];
  /** Ids das corretoras cadastradas (criação manual). */
  exchangeIds: readonly string[];
  /** Chaves cadastradas (id + exchangeId + nome). */
  exchangeKeys: readonly { id: string; exchangeId: string; nome: string }[];
};

const fmtPct = (v: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(3)}%`;

/** Badge de uma perna da arbitragem (COMPRA/VENDA). */
function LegBadge({ leg }: { leg: ForexArbLeg }): React.ReactNode {
  const ehCompra = leg.side === "buy";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
        ehCompra
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
          : "border-red-500/30 bg-red-500/15 text-red-300"
      }`}
    >
      {ehCompra ? "COMPRA" : "VENDA"} {leg.symbol}
      {leg.price !== null ? <span className="font-mono text-slate-400">@{leg.price}</span> : null}
    </span>
  );
}

/** Cadeia de pernas: COMPRA X → VENDA Y → COMPRA Z. */
function LegsChain({ legs }: { legs: readonly ForexArbLeg[] }): React.ReactNode {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {legs.map((leg, i) => (
        <span key={`${leg.side}-${leg.symbol}`} className="flex items-center gap-1.5">
          <LegBadge leg={leg} />
          {i < legs.length - 1 ? <span className="text-slate-600">→</span> : null}
        </span>
      ))}
    </span>
  );
}

/**
 * Painel de operações da arbitragem Forex: abas de Oportunidades, Em Aberto e
 * Encerradas, com ações de fechar posição e excluir estratégia (Server Actions
 * + `router.refresh`).
 */
export function ForexArbBoard({
  strategies,
  trades,
  opportunities,
  exchangeIds,
  exchangeKeys,
}: ForexArbBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aba, setAba] = useState<"open" | "closed" | "opportunities">("opportunities");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000); // Atualização a cada 5 segundos
    return () => clearInterval(interval);
  }, [router]);

  const abertas = strategies.filter((s) => s.positionOpen);
  const encerradas = trades.filter((t) => t.type === "close" && t.status === "executed");

  const executar = (acao: () => Promise<{ ok: boolean }>): void => {
    startTransition(async () => {
      await acao();
      router.refresh();
    });
  };

  const confirmarFechar = (strat: ForexArbStrategy): void => {
    const caminho = strat.legs.map((l) => l.symbol).join(" → ");
    if (
      !confirm(
        `Encerrar a arbitragem ${strat.name} (${caminho})? O robô executará as pernas inversas para zerar a posição.`,
      )
    ) {
      return;
    }
    executar(() => fecharPosicao(strat.id));
  };

  const confirmarExcluir = (strat: ForexArbStrategy): void => {
    if (!confirm(`Excluir a estratégia ${strat.name}? (sem posição aberta)`)) {
      return;
    }
    executar(() => deletarStrategy(strat.id));
  };

  const confirmarFecharTodas = (): void => {
    if (!confirm(`Deseja realmente ZERAR TODAS as ${abertas.length} posições abertas agora?`)) {
      return;
    }
    executar(() => fecharTodasPosicoes());
  };

  const confirmarDeletarTodas = (): void => {
    if (
      !confirm(
        "Deseja realmente apagar TODAS as estratégias e o histórico de operações do banco de dados para recomeçar?",
      )
    ) {
      return;
    }
    executar(() => deletarTodasOperacoes());
  };

  const confirmarVoidClose = (strat: ForexArbStrategy): void => {
    if (
      !confirm(
        `Marcar "${strat.name}" como encerrada pela corretora? Nenhuma ordem será enviada na cTrader.`,
      )
    ) {
      return;
    }
    executar(() => voidClosePosicao(strat.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Nova Estratégia
        </button>
        <button
          type="button"
          onClick={confirmarDeletarTodas}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/60 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Limpar Banco/Histórico
        </button>
      </div>

      {criando ? (
        <ForexStrategyForm
          exchangeIds={exchangeIds}
          exchangeKeys={exchangeKeys}
          onFechar={() => setCriando(false)}
        />
      ) : null}

      {/* Abas */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {(
          [
            {
              key: "opportunities",
              label: "🎯 Oportunidades",
              count: opportunities.length,
            },
            { key: "open", label: "Em Aberto", count: abertas.length },
            { key: "closed", label: "Encerradas", count: encerradas.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setAba(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              aba === tab.key
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold ${
                aba === tab.key ? "bg-white/20" : "bg-slate-800"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Oportunidades */}
      {aba === "opportunities" ? (
        <div className="space-y-3">
          {opportunities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
              Nenhuma oportunidade detectada ainda. Inicie o scanner e aguarde o próximo ciclo.
            </div>
          ) : (
            opportunities.map((opp) => (
              <div key={opp.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-indigo-300">
                      {opp.type}
                    </span>
                    <span className="text-xs text-slate-400">{opp.exchangeId}</span>
                    <LegsChain legs={opp.legs} />
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-black text-emerald-400">
                      {fmtPct(opp.expectedProfitPct)}
                    </div>
                    <div className="text-[11px] text-slate-500">retorno líquido estimado</div>
                  </div>
                </div>
                <div className="mt-3 font-mono text-[11px] text-slate-500">
                  Volume 24h: {opp.amount > 0 ? `$${Math.round(opp.amount).toLocaleString()}` : "—"}{" "}
                  | Detectada em {new Date(opp.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Em aberto */}
      {aba === "open" ? (
        <div className="space-y-4">
          {abertas.length > 0 ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={confirmarFecharTodas}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                <Power className="h-4 w-4" aria-hidden="true" /> Fechar Todas as Posições (
                {abertas.length})
              </button>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            {abertas.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
                Nenhuma posição aberta. As oportunidades lucrativas serão executadas
                automaticamente.
              </div>
            ) : (
              abertas.map((strat) => {
                const livePnl = strat.pnl || 0;
                const livePct = strat.pnlPct || 0;
                const isLucro = livePnl >= 0;

                return (
                  <div
                    key={strat.id}
                    className={`rounded-xl border p-5 ${
                      isLucro
                        ? "border-emerald-500/40 bg-emerald-950/20"
                        : "border-rose-500/40 bg-rose-950/20"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{strat.name}</h3>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          <span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
                            {strat.type}
                          </span>
                          {strat.exchangeId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono text-base font-black ${
                            isLucro ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isLucro ? "+" : ""}${livePnl.toFixed(2)} USD
                        </div>
                        <div
                          className={`font-mono text-[11px] font-bold ${
                            isLucro ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          ({isLucro ? "+" : ""}
                          {livePct.toFixed(3)}%)
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 space-y-2">
                      {strat.legs.map((leg) => (
                        <div
                          key={`${leg.side}-${leg.symbol}`}
                          className="rounded-lg border border-white/5 bg-slate-900/60 p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <LegBadge leg={leg} />
                            <span className="font-mono text-xs font-bold text-slate-300">
                              Preço Entrada: {leg.price ? leg.price : "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>
                              cTrader ID:{" "}
                              {leg.orderId
                                ? leg.orderId.startsWith("Order")
                                  ? leg.orderId
                                  : `#${leg.orderId}`
                                : "—"}
                            </span>
                            <span>
                              Volume real:{" "}
                              {(() => {
                                const raw =
                                  leg.volume && leg.volume > 0
                                    ? leg.volume
                                    : leg.amount && leg.amount > 0
                                      ? leg.amount
                                      : strat.positionVolume && strat.positionVolume > 0
                                        ? strat.positionVolume
                                        : strat.tradeSize;
                                const l =
                                  raw >= 100000
                                    ? raw === 100000
                                      ? 0.01
                                      : raw / 100000
                                    : raw >= 1000
                                      ? raw / 100000
                                      : raw <= 100
                                        ? raw / 10000
                                        : raw / 100;
                                const formattedLote = l < 0.01 ? "0.01" : l.toFixed(2);
                                return `${formattedLote} lote`;
                              })()}
                            </span>
                            <span>
                              Valor Aporte: $
                              {(
                                strat.tradeSize ||
                                (leg.price
                                  ? ((leg.volume || leg.amount || 1000) * leg.price) / 100000
                                  : 50)
                              ).toFixed(2)}{" "}
                              USD
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status em Tempo Real e Trailing Stop Monitor */}
                    <div className="mb-3 space-y-2">
                      <div
                        className={`rounded-lg border p-2.5 transition-all ${
                          strat.trailingActive
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 shadow-sm shadow-emerald-500/10"
                            : "border-slate-700/50 bg-slate-900/50 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-1.5">
                            {strat.trailingActive ? (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                            ) : (
                              <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                            )}
                            <span className="font-mono uppercase tracking-wider text-[11px]">
                              {strat.trailingActive
                                ? "Trailing Stop Ativado"
                                : "Monitoramento Ativo"}
                            </span>
                          </div>
                          {strat.trailingActive ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                              <Lock className="h-3 w-3" /> PISO TRAVADO: +$
                              {strat.trailingFloorUsd.toFixed(2)} USD
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-slate-400">
                              Gatilho: +${strat.trailingActivationUsd.toFixed(2)} USD
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] font-mono text-slate-300">
                          {strat.currentAction ||
                            (strat.trailingActive
                              ? "Protegendo lucro e acompanhando subida do preço"
                              : "Aguardando gatilho de trailing")}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-slate-900/60 border border-white/5 p-2 text-center text-[10px] font-mono">
                        <div>
                          <span className="block text-[9px] text-slate-500">Pico Máximo</span>
                          <span className="font-bold text-emerald-400">
                            +$
                            {strat.peakProfitUsd > 0
                              ? strat.peakProfitUsd.toFixed(2)
                              : Math.max(0, strat.pnl).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500">Piso de Saída</span>
                          <span
                            className={`font-bold ${strat.trailingActive && strat.trailingFloorUsd > 0 ? "text-emerald-300" : "text-slate-500"}`}
                          >
                            {strat.trailingActive && strat.trailingFloorUsd > 0
                              ? `+$${strat.trailingFloorUsd.toFixed(2)}`
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500">Preço Fechamento</span>
                          <span
                            className={`font-bold ${strat.trailingFloorPrice ? "text-amber-300" : "text-slate-500"}`}
                          >
                            {strat.trailingFloorPrice
                              ? strat.trailingFloorPrice.toFixed(4)
                              : strat.trailingActive
                                ? `+$${strat.trailingFloorUsd.toFixed(2)}`
                                : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500">Distância Trail</span>
                          <span className="font-bold text-slate-300">
                            ${strat.trailingDistanceUsd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="text-[11px] text-slate-500">
                        Aberta em{" "}
                        {strat.positionOpenedAt
                          ? new Date(strat.positionOpenedAt).toLocaleTimeString()
                          : "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => confirmarFechar(strat)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                          title="Encerrar posição enviando ordens para cTrader"
                        >
                          <Power className="h-3.5 w-3.5" aria-hidden="true" /> Encerrar Agora
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => confirmarVoidClose(strat)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-700/80 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-600 hover:text-white disabled:opacity-50"
                          title="Marcar como encerrada pela corretora (sem enviar ordens na cTrader)"
                        >
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Encerrada pela
                          Corretora
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {/* Encerradas */}
      {aba === "closed" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {encerradas.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma operação encerrada ainda.
            </div>
          ) : (
            encerradas.map((trade) => {
              const isLucro = trade.realizedPnl >= 0;
              return (
                <div
                  key={trade.id}
                  className={`rounded-xl border p-5 ${
                    isLucro
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : "border-rose-500/30 bg-rose-950/10"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        {trade.strategyName || "Scalping Forex"}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            isLucro
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {isLucro ? "🟢 LUCRO" : "🔴 PREJUÍZO"}
                        </span>
                        <span className="text-xs text-slate-400">{trade.exchangeId}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono text-base font-black ${
                          isLucro ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isLucro ? "+" : ""}${trade.realizedPnl.toFixed(2)} USD
                      </div>
                      {trade.commission ? (
                        <div className="font-mono text-[10px] font-semibold text-rose-300/80">
                          Taxa/Comissão: -${Math.abs(trade.commission).toFixed(2)} USD
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mb-3 space-y-1.5">
                    {trade.legs.map((leg) => (
                      <div
                        key={`${leg.side}-${leg.symbol}`}
                        className="rounded-lg border border-white/5 bg-slate-900/60 p-2 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <LegBadge leg={leg} />
                          <span className="font-mono text-slate-300">
                            Preço: {leg.price || "—"}
                          </span>
                        </div>
                        {leg.orderId ? (
                          <div className="font-mono text-[10px] text-slate-500">
                            Order ID cTrader: #{leg.orderId}
                          </div>
                        ) : null}
                        <div className="flex justify-between font-mono text-[10px] text-slate-400">
                          <span>Volume: {leg.volume ?? leg.amount ?? 0}</span>
                          <span>Valor: ${(leg.amountUsd ?? 0).toFixed(2)} USD</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {trade.reason ? (
                    <div className="mb-3 rounded bg-slate-900/40 p-2 text-center text-[11px] font-mono text-slate-300 border border-white/5">
                      <span className="block text-[10px] text-slate-500 font-sans">
                        Motivo do Fechamento
                      </span>
                      {trade.reason}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-500 font-mono">
                    <span>Fechada em {new Date(trade.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {/* Estratégias monitoradas */}
      {strategies.length > 0 ? (
        <div className="pt-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            Estratégias Monitoradas ({strategies.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {strategies.map((strat) => (
              <div key={strat.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-bold text-white">{strat.name}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      strat.positionOpen
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {strat.positionOpen ? "Aberta" : "Monitorando"}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  {strat.legs.map((l) => l.symbol).join(" → ")}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
                    {strat.type}
                  </span>
                  {strat.exchangeId ? (
                    <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                      {strat.exchangeId}
                    </span>
                  ) : null}
                  {strat.isAutoCreated ? (
                    <span
                      className="rounded border border-cyan-500/30 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300"
                      title="Criada automaticamente pelo scanner"
                    >
                      Auto
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-400">
                    {fmtPct(strat.expectedProfitPct)}
                  </span>
                  {!strat.positionOpen ? (
                    <button
                      type="button"
                      onClick={() => confirmarExcluir(strat)}
                      className="text-slate-500 transition-colors hover:text-red-400"
                      aria-label={`Excluir estratégia ${strat.name}`}
                      title="Excluir estratégia"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
