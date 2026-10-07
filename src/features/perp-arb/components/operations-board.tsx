"use client";

import { useEffect, useState } from "react";

import { ClosedTradeCard } from "@/features/perp-arb/components/closed-trade-card";
import { OpenPositionCard } from "@/features/perp-arb/components/open-position-card";
import { buscarPortfolioLive } from "@/features/perp-arb/perp-arb.actions";
import type { PerpArbStrategy, PerpArbTrade } from "@/features/perp-arb/perp-arb.schema";

type OperationsBoardProps = {
  openPositions: readonly PerpArbStrategy[];
  marriedTrades: readonly PerpArbTrade[];
  trades: readonly PerpArbTrade[];
};

/** Posição ao vivo (polling do backend, que busca nas corretoras). */
type LivePosition = {
  symbol: string;
  entryPrice: number | null;
  markPrice: number | null;
  bidPrice: number | null;
  askPrice: number | null;
  liquidationPrice: number | null;
  leverage: number;
};

/** Moeda spot ao vivo (polling do backend). */
type LiveSpotCoin = {
  asset: string;
  price: number | null;
  bidPrice: number | null;
  askPrice: number | null;
};

/** Intervalos disponíveis para filtrar o histórico de operações encerradas. */
const INTERVALOS: readonly { id: string; label: string; ms: number | null }[] = [
  { id: "1h", label: "Última 1 hora", ms: 60 * 60 * 1000 },
  { id: "6h", label: "Últimas 6 horas", ms: 6 * 60 * 60 * 1000 },
  { id: "24h", label: "Últimas 24 horas", ms: 24 * 60 * 60 * 1000 },
  { id: "7d", label: "Últimos 7 dias", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d", label: "Últimos 30 dias", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "all", label: "Todo o período", ms: null },
];

/**
 * Painel de operações (em aberto + encerradas) com dados AO VIVO: faz polling
 * do `/portfolio/live` a cada 10s via Server Action (o backend consulta as
 * corretoras na hora — fetchTicker/fetchPositions — não o banco) e repassa os
 * preços frescos aos cards de posição aberta.
 */
export function OperationsBoard({
  openPositions,
  marriedTrades,
  trades,
}: OperationsBoardProps): React.ReactNode {
  const [livePositions, setLivePositions] = useState<readonly LivePosition[]>([]);
  const [liveSpotCoins, setLiveSpotCoins] = useState<readonly LiveSpotCoin[]>([]);
  const [aba, setAba] = useState<"open" | "closed">("open");
  // Filtro de intervalo do histórico: default = última 1 hora ao carregar a página.
  const [intervalo, setIntervalo] = useState<string>("1h");
  // Captura o timestamp no início do ciclo de render para consistência do filtro.
  const [now] = useState(() => Date.now());

  const filtroMs = INTERVALOS.find((f) => f.id === intervalo)?.ms ?? null;
  const filteredMarried = marriedTrades.filter((trade) => {
    if (filtroMs === null) return true;
    return now - new Date(trade.createdAt).getTime() <= filtroMs;
  });

  useEffect(() => {
    let ativo = true;
    const buscar = async (): Promise<void> => {
      try {
        const resultado = await buscarPortfolioLive();
        if (!ativo || !resultado.ok) return;
        setLivePositions(resultado.dados.positions);
        setLiveSpotCoins(resultado.dados.spotCoins);
      } catch {
        // Backend lento/indisponível: mantém os últimos dados; o próximo
        // polling tenta de novo (sem unhandledRejection no browser).
      }
    };
    void buscar();
    const interval = setInterval(() => void buscar(), 10000);
    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Operações Realizadas e em Aberto</h2>
        <p className="text-sm text-gray-400">
          Operações casadas (Spot LONG + Perp SHORT) ativas e histórico de execuções. Preços
          atualizados ao vivo a cada 10s.
        </p>
      </div>

      {/* Abas Em Aberto / Encerradas */}
      <div className="mb-4 flex gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setAba("open")}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            aba === "open"
              ? "bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
              : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Em Aberto ({openPositions.length})
        </button>
        <button
          type="button"
          onClick={() => setAba("closed")}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            aba === "closed"
              ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
              : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Encerradas ({marriedTrades.length})
        </button>
      </div>

      {aba === "open" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {openPositions.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
              Nenhuma operação em aberto no momento. O robô abrirá automaticamente quando o funding
              for maior que a taxa mínima configurada.
            </div>
          ) : (
            // Mais antigas primeiro: posição sem data de abertura vai pro fim.
            openPositions
              .toSorted(
                (a, b) =>
                  new Date(a.positionOpenedAt ?? 0).getTime() -
                  new Date(b.positionOpenedAt ?? 0).getTime(),
              )
              .map((s) => (
                <OpenPositionCard
                  key={s.id}
                  strategy={s}
                  trades={trades}
                  livePositions={livePositions}
                  liveSpotCoins={liveSpotCoins}
                />
              ))
          )}
        </div>
      ) : (
        <div>
          {/* Filtro de intervalo do histórico */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Intervalo
            </span>
            <select
              value={intervalo}
              onChange={(e) => setIntervalo(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-indigo-400"
            >
              {INTERVALOS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              ({filteredMarried.length} {filteredMarried.length === 1 ? "operação" : "operações"})
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredMarried.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                {marriedTrades.length === 0
                  ? "Nenhuma operação encerrada no histórico ainda."
                  : "Nenhuma operação encerrada no período selecionado."}
              </div>
            ) : (
              filteredMarried.map((trade) => (
                <ClosedTradeCard key={trade.id} trade={trade} allTrades={trades} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
