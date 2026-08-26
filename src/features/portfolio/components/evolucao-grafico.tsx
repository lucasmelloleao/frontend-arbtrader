"use client";

import type { PortfolioHistorico } from "@/features/portfolio/portfolio.schema";

type EvolucaoGraficoProps = {
  historico: PortfolioHistorico;
};

const LARGURA = 800;
const ALTURA = 320;
const PADDING = { top: 16, right: 16, bottom: 32, left: 64 };

const formatarUsd = (valor: number): string =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Constrói o `d` de uma polyline SVG a partir dos valores normalizados. */
function polilinha(valores: number[], min: number, max: number): string {
  const span = max - min || 1;
  return valores
    .map((valor, i) => {
      const x =
        PADDING.left +
        (i / Math.max(valores.length - 1, 1)) * (LARGURA - PADDING.left - PADDING.right);
      const y = PADDING.top + (1 - (valor - min) / span) * (ALTURA - PADDING.top - PADDING.bottom);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Gráfico de evolução patrimonial (SVG puro, sem lib). Desenha as séries de
 * saldo spot, saldo futuros e total. Client porque não há dado dinâmico — é
 * render puro; o `use client` garante hidratação consistente do SVG com o
 * formato de data local.
 */
export function EvolucaoGrafico({ historico }: EvolucaoGraficoProps): React.ReactNode {
  if (historico.length < 2) {
    return (
      <div className="flex h-[380px] items-center justify-center">
        <p className="text-slate-500">
          Sem dados suficientes para o gráfico. Conecte seu backend para ver a evolução.
        </p>
      </div>
    );
  }

  const spots = historico.map((p) => p.spotTotalUsd);
  const futuros = historico.map((p) => p.futuresTotalUsd);
  const totais = historico.map((p) => p.totalUsdValue);
  const todos = [...spots, ...futuros, ...totais];
  const min = Math.min(...todos);
  const max = Math.max(...todos);

  const rotuloData = (i: number): string => {
    const d = new Date(historico[i].timestamp);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="min-w-[600px]">
        <title>Gráfico de evolução patrimonial</title>
        {/* Linhas de grade horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PADDING.top + f * (ALTURA - PADDING.top - PADDING.bottom);
          const valor = max - f * (max - min);
          return (
            <g key={f}>
              <line
                x1={PADDING.left}
                x2={LARGURA - PADDING.right}
                y1={y}
                y2={y}
                stroke="#334155"
                strokeOpacity={0.5}
              />
              <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                ${formatarUsd(valor)}
              </text>
            </g>
          );
        })}

        {/* Rótulos de data no eixo X */}
        {historico.map((ponto, i) =>
          i % Math.max(Math.floor(historico.length / 6), 1) === 0 ? (
            <text
              key={ponto.timestamp}
              x={
                PADDING.left +
                (i / Math.max(historico.length - 1, 1)) * (LARGURA - PADDING.left - PADDING.right)
              }
              y={ALTURA - 8}
              textAnchor="middle"
              fontSize={11}
              fill="#64748b"
            >
              {rotuloData(i)}
            </text>
          ) : null,
        )}

        <polyline
          points={polilinha(spots, min, max)}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
        />
        <polyline
          points={polilinha(futuros, min, max)}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
        />
        <polyline
          points={polilinha(totais, min, max)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2.5}
          strokeDasharray="6 3"
        />
      </svg>

      <div className="mt-2 flex items-center justify-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Saldo Spot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-indigo-500" /> Saldo Futuros
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-amber-400" /> Total
        </span>
      </div>
    </div>
  );
}
