"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Plus, Power, TrendingUp, X } from "lucide-react";

import { ForexStrategyForm } from "@/features/forex-arb/components/forex-strategy-form";
import { deletarStrategy, fecharPosicao, fecharTodasPosicoes } from "@/features/forex-arb/forex-arb.actions";
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

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
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
    }, 2000); // Atualização rápida a cada 2 segundos
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

  return (
    <div className="space-y-4">
      {/* Criação manual */}
      {criando ? (
        <ForexStrategyForm
          exchangeIds={exchangeIds}
          exchangeKeys={exchangeKeys}
          onFechar={() => setCriando(false)}
        />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Criar Estratégia
          </button>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {(
          [
            { key: "opportunities", label: "🎯 Oportunidades", count: opportunities.length },
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
                <Power className="h-4 w-4" aria-hidden="true" /> Fechar Todas as Posições ({abertas.length})
              </button>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            {abertas.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
                Nenhuma posição aberta. As oportunidades lucrativas serão executadas automaticamente.
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
                          ({isLucro ? "+" : ""}{livePct.toFixed(3)}%)
                        </div>
                      </div>
                    </div>
                <div className="mb-4 space-y-2">
                  {strat.legs.map((leg) => (
                    <div key={`${leg.side}-${leg.symbol}`} className="rounded-lg border border-white/5 bg-slate-900/60 p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <LegBadge leg={leg} />
                        <span className="font-mono text-xs font-bold text-slate-300">
                          Preço Entrada: {leg.price ? leg.price : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Order/Pos ID cTrader: #{leg.orderId || '—'}</span>
                        <span>Volume: {leg.amount ? (leg.amount / 100).toFixed(2) + ' Lote(s)' : '0.01 Lote'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-900/40 p-2 text-center text-[11px] font-mono">
                  <div>
                    <span className="block text-[10px] text-slate-500">Take Profit</span>
                    <span className="font-bold text-emerald-400">+0.10%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Trailing Stop</span>
                    {strat.isTrailingActive ? (
                      <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> ATIVADO
                      </span>
                    ) : (
                      <span className="font-bold text-slate-400">+0.01%</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Stop Loss</span>
                    <span className="font-bold text-rose-400">-0.10%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-[11px] text-slate-500">
                    Aberta em{" "}
                    {strat.positionOpenedAt
                      ? new Date(strat.positionOpenedAt).toLocaleTimeString()
                      : "—"}
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => confirmarFechar(strat)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    <Power className="h-3.5 w-3.5" aria-hidden="true" /> Encerrar Agora
                  </button>
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
        <div className="grid gap-4 md:grid-cols-2">
          {encerradas.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              Nenhuma operação encerrada ainda.
            </div>
          ) : (
            encerradas.map((trade) => (
              <div key={trade.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {trade.strategyName || "Arbitragem"}
                    </h3>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {trade.legs.map((l) => l.symbol).join(" → ") || "—"}
                    </div>
                  </div>
                  <div
                    className={`font-mono text-lg font-black ${
                      trade.realizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmtUsd(trade.realizedPnl)}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-500">
                  <span>Fechada em {new Date(trade.createdAt).toLocaleString()}</span>
                  {trade.reason ? <span className="text-amber-300/80">{trade.reason}</span> : null}
                </div>
              </div>
            ))
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
