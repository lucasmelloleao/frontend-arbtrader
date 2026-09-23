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
  buscarStatusMetaLabelingFxPro,
  treinarModeloMetaLabelingFxPro,
} from "@/features/fxpro/fxpro.actions";
import type { FxProMetaModelStatus } from "@/features/fxpro/fxpro.schema";

export function FxProAiStrategyView(): React.ReactNode {
  const [status, setStatus] = useState<FxProMetaModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const carregarStatus = async (): Promise<void> => {
    const res = await buscarStatusMetaLabelingFxPro();
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
      const res = await buscarStatusMetaLabelingFxPro();
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
    const res = await treinarModeloMetaLabelingFxPro();
    if (res.ok) {
      setFeedback({ ok: true, msg: res.message });
      await carregarStatus();
    } else {
      setFeedback({ ok: false, msg: res.erro });
    }
    setTraining(false);
  };

  const hasEnoughData = (status?.totalExecutedTrades || 0) >= (status?.minTradesRequired || 5);
  const featureList = status?.metadata?.featureImportance || [
    { feature: "Kaufman ER", importance: 24, description: "Eficiência de Tendência Forex" },
    { feature: "Lo-MacKinlay VR", importance: 22, description: "Persistência vs Random Walk" },
    { feature: "ATR em Pips", importance: 16, description: "Volatilidade do Par" },
    { feature: "Spread Dinâmico", importance: 14, description: "Custo de Liquidez da FxPro" },
    { feature: "Expected Value ($EV)", importance: 12, description: "Vantagem Estatística" },
    { feature: "Horário da Sessão", importance: 8, description: "Londres / NY / Ásia" },
    { feature: "Lote Operado", importance: 4, description: "Tamanho da Posição" },
  ];
  const datasetSamples = status?.metadata?.recentDatasetSamples || [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                IA Meta-Labeling FxPro cTrader (Gate 4)
              </h2>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-300">
              Random Forest não-linear com 100 árvores de decisão. Atua como um{" "}
              <strong>Filtro Guardião de Risco</strong>: avalia a probabilidade preditiva de vitória
              de cada ordem Forex/CFD e veta entradas em armadilhas de reversão (probabilidade de
              vitória abaixo de 55%).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTreinar}
              disabled={training || loading || !hasEnoughData}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 disabled:opacity-50"
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
              ? "Veta ordens com P(Win) < 55%"
              : "Modo bypass até o primeiro treino"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Acurácia do Modelo</span>
            <BarChart2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-indigo-400">
            {status?.metadata?.accuracy ? `${status.metadata.accuracy}%` : "--"}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {status?.metadata?.winRateBaseline
              ? `WinRate Base: ${status.metadata.winRateBaseline}%`
              : "Calibração histórica"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Operações Auditadas</span>
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {status?.totalExecutedTrades || 0} / {status?.minTradesRequired || 5}
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
            Random Forest com bagging estatístico
          </p>
        </div>
      </div>

      {/* Gráfico Visual: Importância das Features */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Gráfico de Pesos e Importância das Variáveis (FxPro Decision Weights)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Critérios para validação de alta certeza Forex
          </span>
        </div>

        <div className="mt-6 space-y-3.5">
          {featureList.map(
            (item: { feature: string; importance: number; description: string }, idx: number) => {
              const colors = [
                "bg-gradient-to-r from-indigo-500 to-cyan-400",
                "bg-gradient-to-r from-cyan-500 to-teal-400",
                "bg-gradient-to-r from-emerald-500 to-teal-400",
                "bg-gradient-to-r from-amber-500 to-orange-400",
                "bg-gradient-to-r from-purple-500 to-indigo-400",
                "bg-gradient-to-r from-rose-500 to-pink-400",
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
                    <span className="font-mono font-bold text-indigo-400">{item.importance}%</span>
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
            <Layers className="h-4 w-4 text-indigo-400" />
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
            Nenhum dado gravado no dataset ainda. Conforme o robô operar na FxPro cTrader, os
            snapshots de mercado serão catalogados automaticamente aqui para calibração contínua.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-900/80 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="p-3">Par Forex</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3 font-mono">ER</th>
                  <th className="p-3 font-mono">VR</th>
                  <th className="p-3 font-mono">ATR (Pips)</th>
                  <th className="p-3 font-mono">Spread (Pips)</th>
                  <th className="p-3 font-mono">EV ($)</th>
                  <th className="p-3 font-mono">Lote</th>
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
                    <td className="p-3 font-mono font-bold text-indigo-300">{row.symbol}</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${row.side === "BUY" ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50" : "bg-rose-950 text-rose-300 border border-rose-800/50"}`}
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
                    <td className="p-3 font-mono text-slate-300">{row.atrPips.toFixed(1)}</td>
                    <td className="p-3 font-mono text-slate-300">{row.spreadPips.toFixed(1)}</td>
                    <td className="p-3 font-mono text-slate-300">
                      ${row.expectedValue.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-slate-300">{row.lotSize}</td>
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
          Como o Gate 4 Blinda suas Operações na FxPro cTrader
        </div>
        <div className="grid grid-cols-1 gap-4 text-xs text-slate-300 md:grid-cols-3">
          <div className="rounded-lg bg-slate-900/60 p-3">
            <span className="font-bold text-cyan-400">1. Veto Anti-Ruído (Random Walk)</span>
            <p className="mt-1 text-slate-400">
              Impede ordens quando o par Forex está oscilando sem tendência ou após movimentos
              climáticos.
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/60 p-3">
            <span className="font-bold text-indigo-400">2. Fractional Kelly</span>
            <p className="mt-1 text-slate-400">
              Dimensiona o volume de lotes de forma ótima, maximizando o crescimento do capital sem
              risco de ruína.
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/60 p-3">
            <span className="font-bold text-emerald-400">3. Treinamento Adaptativo</span>
            <p className="mt-1 text-slate-400">
              Retreina o modelo de IA em 1 clique com o histórico de execuções reais da conta
              cTrader.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
