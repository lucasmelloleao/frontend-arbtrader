"use client";

import { useId, useState } from "react";
import type { ForexArbTrade } from "@/features/forex-arb/forex-arb.schema";

type ForexTimelineChartProps = {
  trades: readonly ForexArbTrade[];
};

const CORES_PALETA = [
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
];

const LARGURA = 900;
const ALTURA = 320;
const PADDING = { top: 24, right: 32, bottom: 44, left: 68 };

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : ""}$${v.toFixed(2)}`;

export function ForexTimelineChart({ trades }: ForexTimelineChartProps): React.ReactNode {
  const chartId = useId();
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    symbol: string;
    pnl: number;
    accumPnl: number;
    dateStr: string;
  } | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");

  // Ordena trades encerrados do mais antigo ao mais recente
  const sortedTrades = trades
    .filter((t) => t.status !== "detected" && t.status !== "pending")
    .map((t) => {
      const sym =
        t.legs.at(0)?.symbol ||
        t.strategyName.replace("Scalping ", "").replace(/ \(.*\)/, "") ||
        "OUTROS";
      return {
        symbol: sym,
        pnl: t.realizedPnl,
        timestamp: new Date(t.createdAt || 0).getTime(),
      };
    })
    .filter((t) => !Number.isNaN(t.timestamp) && t.timestamp > 0)
    .toSorted((a, b) => a.timestamp - b.timestamp);

  // Lista única de ativos
  const symbols = (() => {
    const set = new Set<string>();
    sortedTrades.forEach((t) => {
      if (t.symbol) set.add(t.symbol);
    });
    return Array.from(set).toSorted();
  })();

  // Paleta de cores por símbolo
  const symbolColors = (() => {
    const map = new Map<string, string>();
    symbols.forEach((sym, idx) => {
      map.set(sym, CORES_PALETA[idx % CORES_PALETA.length]);
    });
    return map;
  })();

  // Calcula trajetórias de lucro acumulado por ativo e global
  const { series, minPnl, maxPnl, timeStart, timeEnd } = (() => {
    if (sortedTrades.length === 0) {
      return { series: [], minPnl: 0, maxPnl: 0, timeStart: 0, timeEnd: 0 };
    }

    const tStart = sortedTrades[0].timestamp;
    const tEnd = sortedTrades[sortedTrades.length - 1].timestamp;

    // Séries por ativo
    const symbolPoints = new Map<
      string,
      Array<{ timestamp: number; pnl: number; accumPnl: number; symbol: string }>
    >();

    // Inicializa ponto zero de cada ativo
    symbols.forEach((sym) => {
      symbolPoints.set(sym, [{ timestamp: tStart, pnl: 0, accumPnl: 0, symbol: sym }]);
    });

    const currentAccum = new Map<string, number>();
    symbols.forEach((sym) => currentAccum.set(sym, 0));

    let globalAccum = 0;
    const globalPoints: Array<{
      timestamp: number;
      pnl: number;
      accumPnl: number;
      symbol: string;
    }> = [{ timestamp: tStart, pnl: 0, accumPnl: 0, symbol: "GLOBAL" }];

    sortedTrades.forEach((t) => {
      const sym = t.symbol || "OUTROS";
      const pnl = t.pnl || 0;
      const prev = currentAccum.get(sym) || 0;
      const next = prev + pnl;
      currentAccum.set(sym, next);

      const list = symbolPoints.get(sym);
      if (list) {
        list.push({ timestamp: t.timestamp, pnl, accumPnl: next, symbol: sym });
      }

      globalAccum += pnl;
      globalPoints.push({ timestamp: t.timestamp, pnl, accumPnl: globalAccum, symbol: "GLOBAL" });
    });

    const allYValues: number[] = [0];
    symbolPoints.forEach((pts) => pts.forEach((p) => allYValues.push(p.accumPnl)));
    globalPoints.forEach((p) => allYValues.push(p.accumPnl));

    const min = Math.min(...allYValues);
    const max = Math.max(...allYValues);

    // Margem de 10% vertical
    const span = max - min || 1;
    const padMin = min - span * 0.1;
    const padMax = max + span * 0.1;

    return {
      series: [
        { symbol: "GLOBAL", points: globalPoints, color: "#f8fafc" },
        ...symbols.map((sym) => ({
          symbol: sym,
          points: symbolPoints.get(sym) || [],
          color: symbolColors.get(sym) || "#06b6d4",
        })),
      ],
      minPnl: padMin,
      maxPnl: padMax,
      timeStart: tStart,
      timeEnd: tEnd === tStart ? tStart + 1 : tEnd,
    };
  })();

  if (sortedTrades.length < 2) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 p-6 text-center">
        <p className="text-sm font-semibold text-slate-400">
          Dados insuficientes para renderizar a linha do tempo.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          São necessárias pelo menos duas operações encerradas no período selecionado.
        </p>
      </div>
    );
  }

  const getX = (t: number): number => {
    const factor = (t - timeStart) / (timeEnd - timeStart || 1);
    return PADDING.left + factor * (LARGURA - PADDING.left - PADDING.right);
  };

  const getY = (val: number): number => {
    const factor = (val - minPnl) / (maxPnl - minPnl || 1);
    return PADDING.top + (1 - factor) * (ALTURA - PADDING.top - PADDING.bottom);
  };

  const yZero = getY(0);

  // Filtra séries para renderizar
  const displayedSeries =
    selectedSymbol === "ALL"
      ? series
      : series.filter((s) => s.symbol === selectedSymbol || s.symbol === "GLOBAL");

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            Curva de Ganho e Perda na Linha do Tempo (P/L Acumulado por Ativo)
          </h4>
          <p className="text-xs text-slate-400">
            Acompanhe o desempenho temporal individual de cada par de moedas operado pela
            Pepperstone.
          </p>
        </div>

        {/* Filtro por Ativo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSymbol("ALL")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedSymbol === "ALL"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Todos os Ativos
          </button>
          {symbols.map((sym) => {
            const isSel = selectedSymbol === sym;
            const color = symbolColors.get(sym) || "#06b6d4";
            return (
              <button
                type="button"
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                  isSel ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
                style={isSel ? { borderColor: color, borderWidth: 1 } : {}}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {sym}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="min-w-[700px] w-full">
          <title>Gráfico de Linha do Tempo Pepperstone Forex</title>
          <defs>
            <linearGradient id={`${chartId}-zero-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade Horizontais */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const val = minPnl + (1 - f) * (maxPnl - minPnl);
            const y = PADDING.top + f * (ALTURA - PADDING.top - PADDING.bottom);
            return (
              <g key={f}>
                <line
                  x1={PADDING.left}
                  x2={LARGURA - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {fmtUsd(val)}
                </text>
              </g>
            );
          })}

          {/* Linha Zero de Referência (Breakeven) */}
          {yZero >= PADDING.top && yZero <= ALTURA - PADDING.bottom && (
            <g>
              <line
                x1={PADDING.left}
                x2={LARGURA - PADDING.right}
                y1={yZero}
                y2={yZero}
                stroke="#64748b"
                strokeWidth={1.5}
                strokeOpacity={0.8}
              />
              <text
                x={LARGURA - PADDING.right + 6}
                y={yZero + 3}
                fontSize={10}
                fill="#94a3b8"
                fontWeight="bold"
              >
                $0.00
              </text>
            </g>
          )}

          {/* Rótulos de Tempo no Eixo X */}
          {(() => {
            const steps = 5;
            const labels = [];
            for (let i = 0; i <= steps; i++) {
              const t = timeStart + (i / steps) * (timeEnd - timeStart);
              const x = getX(t);
              const date = new Date(t);
              const str = `${String(date.getHours()).padStart(2, "0")}:${String(
                date.getMinutes(),
              ).padStart(2, "0")} ${String(date.getDate()).padStart(2, "0")}/${String(
                date.getMonth() + 1,
              ).padStart(2, "0")}`;
              labels.push(
                <text
                  key={i}
                  x={x}
                  y={ALTURA - 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#64748b"
                  fontFamily="sans-serif"
                >
                  {str}
                </text>,
              );
            }
            return labels;
          })()}

          {/* Renderização das Séries de Linhas */}
          {displayedSeries.map((s) => {
            const isGlobal = s.symbol === "GLOBAL";
            const pts = s.points
              .map((p) => `${getX(p.timestamp).toFixed(1)},${getY(p.accumPnl).toFixed(1)}`)
              .join(" ");

            return (
              <g key={s.symbol}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isGlobal ? 2 : 2.5}
                  strokeDasharray={isGlobal ? "4 4" : undefined}
                  strokeOpacity={isGlobal ? 0.6 : 0.95}
                />

                {/* Marcadores dos trades */}
                {!isGlobal &&
                  s.points.slice(1).map((p) => {
                    const cx = getX(p.timestamp);
                    const cy = getY(p.accumPnl);
                    const isPositiveTrade = p.pnl >= 0;

                    return (
                      <circle
                        key={`${p.symbol}-${p.timestamp}-${p.accumPnl}`}
                        cx={cx}
                        cy={cy}
                        r={3.5}
                        fill={isPositiveTrade ? "#10b981" : "#f43f5e"}
                        stroke={s.color}
                        strokeWidth={1.5}
                        className="cursor-pointer transition-transform hover:scale-150"
                        onMouseEnter={() => {
                          const date = new Date(p.timestamp);
                          const dateStr = `${String(date.getHours()).padStart(2, "0")}:${String(
                            date.getMinutes(),
                          ).padStart(
                            2,
                            "0",
                          )}:${String(date.getSeconds()).padStart(2, "0")} (${String(
                            date.getDate(),
                          ).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")})`;
                          setHoveredPoint({
                            x: cx,
                            y: cy,
                            symbol: p.symbol,
                            pnl: p.pnl,
                            accumPnl: p.accumPnl,
                            dateStr,
                          });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {/* Tooltip Dinâmico */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{
              left: `${(hoveredPoint.x / LARGURA) * 100}%`,
              top: `${(hoveredPoint.y / ALTURA) * 100}%`,
            }}
          >
            <div className="font-mono font-bold text-cyan-400">{hoveredPoint.symbol}</div>
            <div className="text-[11px] text-slate-400">{hoveredPoint.dateStr}</div>
            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">Trade:</span>
              <span
                className={`font-bold ${
                  hoveredPoint.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {fmtUsd(hoveredPoint.pnl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">Acumulado:</span>
              <span
                className={`font-bold ${
                  hoveredPoint.accumPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {fmtUsd(hoveredPoint.accumPnl)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legenda de Ativos */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-800/80 pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="inline-block h-0.5 w-4 bg-slate-100" style={{ borderStyle: "dashed" }} />
          Total Consolidado
        </span>
        {symbols.map((sym) => (
          <span key={sym} className="flex items-center gap-1.5 font-medium text-slate-200">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: symbolColors.get(sym) || "#06b6d4" }}
            />
            {sym}
          </span>
        ))}
      </div>
    </div>
  );
}
