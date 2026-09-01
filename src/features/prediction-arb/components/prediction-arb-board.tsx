"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Plus, Power, TrendingUp, X, XCircle } from "lucide-react";

import { PredictionStrategyForm } from "@/features/prediction-arb/components/prediction-strategy-form";
import {
  aumentarAporte,
  deletarStrategy,
  fecharPosicao,
  voidCloseStrategy,
} from "@/features/prediction-arb/prediction-arb.actions";
import type {
  PredictionArbStrategy,
  PredictionArbTrade,
} from "@/features/prediction-arb/prediction-arb.schema";

type PredictionArbBoardProps = {
  strategies: readonly PredictionArbStrategy[];
  trades: readonly PredictionArbTrade[];
  exchangeKeys: readonly { id: string; exchangeId: string; nome: string }[];
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
const fmtPct = (v: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

/**
 * Painel principal do Polymarket Arb: abas para Posições Abertas, Estratégias Monitoradas
 * e Histórico de Trades com auto-refresh a cada 10s.
 */
export function PredictionArbBoard({
  strategies,
  trades,
  exchangeKeys,
}: PredictionArbBoardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aba, setAba] = useState<"open" | "monitored" | "closed">("open");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const abertas = strategies.filter((s) => s.positionOpen);
  const monitorando = strategies.filter((s) => !s.positionOpen);
  const encerradas = trades.filter((t) => t.status === "executed" || t.status === "simulated");

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
      {/* Botão de Criação */}
      {criando ? (
        <PredictionStrategyForm exchangeKeys={exchangeKeys} onFechar={() => setCriando(false)} />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Criar Estratégia Polymarket
          </button>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {(
          [
            { key: "open", label: "Posições Abertas", count: abertas.length },
            { key: "monitored", label: "Monitorando", count: monitorando.length },
            { key: "closed", label: "Histórico de Trades", count: encerradas.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setAba(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
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
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">{strat.slug}</div>
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
        <div className="space-y-3">
          {encerradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-500">
              <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
              Nenhum trade encerrado registrado.
            </div>
          ) : (
            encerradas.map((t, idx) => (
              <div
                key={t.id || `${t.slug}-${idx}`}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{t.question || t.slug}</h4>
                    <div className="mt-0.5 text-xs text-slate-400 font-mono">
                      Tipo: {t.type} | Lado: {t.side}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div
                      className={`text-base font-black ${t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {fmtUsd(t.pnl)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
