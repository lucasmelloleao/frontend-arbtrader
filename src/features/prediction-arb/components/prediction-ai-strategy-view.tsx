"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  ShieldAlert,
  Activity,
  Layers,
  Check,
  X,
} from "lucide-react";
import {
  buscarStatusMetaLabelingPolymarket,
  treinarModeloMetaLabelingPolymarket,
} from "@/features/prediction-arb/prediction-arb.actions";
import type { PredictionMetaModelStatus } from "@/features/prediction-arb/prediction-arb.schema";

export function PredictionAiStrategyView(): React.ReactNode {
  const [status, setStatus] = useState<PredictionMetaModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const carregarStatus = async (): Promise<void> => {
    const res = await buscarStatusMetaLabelingPolymarket();
    if (res.ok) {
      setStatus(res.data);
    }
    setLoading(false);
  };

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    await carregarStatus();
  };

  useEffect(() => {
    let ativo = true;
    const fetchStatus = async (): Promise<void> => {
      const res = await buscarStatusMetaLabelingPolymarket();
      if (ativo) {
        if (res.ok) setStatus(res.data);
        setLoading(false);
      }
    };
    void fetchStatus();
    return () => {
      ativo = false;
    };
  }, []);

  const handleTreinar = async (): Promise<void> => {
    setTraining(true);
    setFeedback(null);
    const res = await treinarModeloMetaLabelingPolymarket();
    if (res.ok) {
      setFeedback({ ok: true, msg: res.message });
      await carregarStatus();
    } else {
      setFeedback({ ok: false, msg: res.erro });
    }
    setTraining(false);
  };

  const hasEnoughData = (status?.totalExecutedTrades || 0) >= (status?.minTradesRequired || 10);
  const featureList = status?.metadata?.featureImportance || [
    { feature: "Kaufman ER", importance: 20, description: "Eficiência de Tendência Spot" },
    { feature: "Lo-MacKinlay VR", importance: 18, description: "Persistência de Preço" },
    { feature: "ATR 1m (%)", importance: 14, description: "Volatilidade do Ativo" },
    { feature: "Distância Spot ao Strike", importance: 14, description: "Margem de Segurança" },
    { feature: "Expected Value ($EV)", importance: 10, description: "Vantagem Matemática" },
    { feature: "Edge (%)", importance: 8, description: "Vantagem Percentual" },
    { feature: "Preço de Entrada", importance: 6, description: "Cotação da Opção" },
    { feature: "Segundos para Vencimento", importance: 4, description: "Tempo Restante (<= 1h)" },
    { feature: "Velocidade Prob 30s", importance: 2, description: "Aceleração Direcional" },
    { feature: "Volatilidade Prob 60s", importance: 2, description: "Estabilidade da Opção" },
    { feature: "Drenagem Ask Livro", importance: 2, description: "Pressão Compradora CLOB" },
  ];
  const datasetSamples = status?.metadata?.recentDatasetSamples || [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">IA Meta-Labeling Polymarket (Gate 4)</h2>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-300">
              Random Forest não-linear com 100 árvores de decisão. Atua como um{" "}
              <strong>Filtro Guardião de Risco</strong>: avalia a probabilidade real de vitória de
              cada aposta direcional na Polymarket (sub-1h) e veta ordens com armadilhas de
              reversão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTreinar}
              disabled={training || loading || !hasEnoughData}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-500 disabled:opacity-50"
            >
              <Cpu className={`h-4 w-4 ${training ? "animate-spin" : ""}`} />
              {training ? "Treinando IA..." : "Treinar Cérebro IA"}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800"
              title="Atualizar Status"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs font-medium ${
            feedback.ok
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/40 text-rose-300"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Grid de Métricas do Modelo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status do Gate 4</span>
            {status?.isTrained ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {status?.isTrained ? "Ativo (Filtro Ligado)" : "Aguardando Treino"}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {status?.isTrained
              ? "Veta entradas onde P(Win) < 55%"
              : "Modo bypass até o primeiro treino"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Acurácia do Modelo</span>
            <BarChart2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-purple-400">
            {status?.metadata?.accuracy ? `${status.metadata.accuracy}%` : "--"}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {status?.metadata?.winRateBaseline
              ? `WinRate Base: ${status.metadata.winRateBaseline}%`
              : "Base de calibração"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Operações Auditadas</span>
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {status?.totalExecutedTrades || 0} / {status?.minTradesRequired || 10}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {hasEnoughData ? "Base suficiente para treino" : "Colete mais trades para treinar"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Árvores de Decisão</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {status?.metadata?.nEstimators
              ? `${status.metadata.nEstimators} Árvores`
              : "100 Árvores"}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Random Forest não-linear com bootstrapping
          </p>
        </div>
      </div>

      {/* Gráfico Visual: Importância das Features */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Gráfico de Importância das Variáveis (Polymarket Decision Weights)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Critérios para validação de alta certeza
          </span>
        </div>

        <div className="mt-6 space-y-3.5">
          {featureList.map(
            (item: { feature: string; importance: number; description: string }, idx: number) => {
              const colors = [
                "bg-gradient-to-r from-purple-500 to-indigo-400",
                "bg-gradient-to-r from-cyan-500 to-teal-400",
                "bg-gradient-to-r from-emerald-500 to-teal-400",
                "bg-gradient-to-r from-amber-500 to-orange-400",
                "bg-gradient-to-r from-pink-500 to-rose-400",
                "bg-gradient-to-r from-blue-500 to-cyan-400",
                "bg-gradient-to-r from-slate-500 to-slate-400",
              ];
              const barColor = colors[idx % colors.length];

              return (
                <div key={item.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.feature}</span>
                      <span className="text-[11px] text-slate-400">({item.description})</span>
                    </div>
                    <span className="font-mono font-bold text-purple-400">{item.importance}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${Math.max(item.importance * 3.5, 4)}%` }}
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Tabela do Dataset de Treinamento da IA */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Tabela de Amostragem do Dataset (Features Gravadas a Cada Operação)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {datasetSamples.length} amostras recentes analisadas
          </span>
        </div>

        {datasetSamples.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Nenhum dado gravado no dataset ainda. Conforme o robô operar na Polymarket, os snapshots
            de mercado serão catalogados automaticamente aqui para calibração contínua.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-900/80 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="p-3">Mercado / Pergunta</th>
                  <th className="p-3">Lado</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3 font-mono">ER</th>
                  <th className="p-3 font-mono">VR</th>
                  <th className="p-3 font-mono">Spot Dist (%)</th>
                  <th className="p-3 font-mono">ATR (%)</th>
                  <th className="p-3 font-mono">EV ($)</th>
                  <th className="p-3 font-mono text-cyan-400">Vel. 30s</th>
                  <th className="p-3 font-mono text-cyan-400">Vol. 60s</th>
                  <th className="p-3 font-mono text-cyan-400">Drenagem</th>
                  <th className="p-3 font-mono">P(Win) IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {datasetSamples.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      row.isWin ? "bg-emerald-500/5" : "bg-rose-500/5"
                    }`}
                  >
                    <td
                      className="max-w-[200px] truncate p-3 font-mono font-medium text-purple-300"
                      title={row.question}
                    >
                      {row.question}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${row.side === "YES" ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50" : "bg-rose-950 text-rose-300 border border-rose-800/50"}`}
                      >
                        {row.side}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.isWin
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {row.isWin ? (
                          <>
                            <Check className="h-3 w-3" /> WIN (+${row.pnl.toFixed(2)})
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" /> LOSS (-${Math.abs(row.pnl).toFixed(2)})
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{row.er.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-300">{row.varianceRatio.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-300">
                      {row.spotDistancePct.toFixed(2)}%
                    </td>
                    <td className="p-3 font-mono text-slate-300">{row.atrPct.toFixed(2)}%</td>
                    <td className="p-3 font-mono text-slate-300">
                      ${row.expectedValue.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-cyan-300">
                      {(row.probVelocity30s ?? 0) > 0 ? `+${((row.probVelocity30s ?? 0) * 100).toFixed(1)}%` : `${((row.probVelocity30s ?? 0) * 100).toFixed(1)}%`}
                    </td>
                    <td className="p-3 font-mono text-cyan-300">
                      {((row.probVolatility60s ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 font-mono text-cyan-300">
                      {(row.askDepletionRate ?? 0).toFixed(1)} sh/s
                    </td>
                    <td className="p-3 font-mono font-bold">
                      <span className={row.probWin >= 55 ? "text-emerald-400" : "text-amber-400"}>
                        {row.probWin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explicação Teórica do Gate 4 */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <ShieldAlert className="h-4 w-4 text-emerald-400" />
          Como o Gate 4 Blinda suas Apostas na Polymarket
        </div>
        <div className="grid grid-cols-1 gap-4 text-xs text-slate-300 md:grid-cols-3">
          <div className="rounded-lg bg-slate-900/60 p-3">
            <span className="font-bold text-cyan-400">1. Veto Anti-Armadilha</span>
            <p className="mt-1 text-slate-400">
              Impede entradas quando a cotação da opção está inflada mas o preço spot colou no
              strike com volatilidade alta.
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/60 p-3">
            <span className="font-bold text-purple-400">2. Exigência de $EV &gt; 0</span>
            <p className="mt-1 text-slate-400">
              Garante que o retorno oferecido pelo mercado seja estatisticamente superior ao risco
              assumido antes da execução.
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/60 p-3">
            <span className="font-bold text-emerald-400">3. Treinamento Adaptativo</span>
            <p className="mt-1 text-slate-400">
              Permite retreinar o cérebro da IA com 1 clique usando o histórico real de vitórias e
              derrotas gravadas no banco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
