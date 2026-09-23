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
  buscarStatusMetaLabeling,
  treinarModeloMetaLabeling,
} from "@/features/deriv/deriv.actions";
import type { DerivMetaModelStatus } from "@/features/deriv/deriv.schema";

export function DerivAiStrategyView(): React.ReactNode {
  const [status, setStatus] = useState<DerivMetaModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const carregarStatus = async (): Promise<void> => {
    const res = await buscarStatusMetaLabeling();
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
      const res = await buscarStatusMetaLabeling();
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
    const res = await treinarModeloMetaLabeling();
    if (res.ok) {
      setFeedback({ ok: true, msg: res.message });
      await carregarStatus();
    } else {
      setFeedback({ ok: false, msg: res.erro });
    }
    setTraining(false);
  };

  const hasEnoughData = (status?.totalExecutedTrades || 0) >= (status?.minTradesRequired || 15);
  const featureList = status?.metadata?.featureImportance || [];
  const datasetSamples = status?.metadata?.recentDatasetSamples || [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">IA Meta-Labeling (Random Forest)</h2>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-300">
              Arquitetura quantitativa inspirada em Marcos López de Prado. A IA atua como um{" "}
              <strong>Diretor de Risco (Gate 4)</strong>: em vez de prever subida ou descida, ela
              prevê a probabilidade real de o seu robô vencer a operação dadas as condições ocultas
              e não-lineares da Deriv.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTreinar}
              disabled={training || loading || !hasEnoughData}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500 disabled:opacity-50"
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
            {status?.isTrained ? "Ativo (Filtro Ligado)" : "Aguardando Treinamento"}
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
            <BarChart2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-cyan-400">
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
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {status?.totalExecutedTrades || 0} / {status?.minTradesRequired || 15}
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
            Ensemble não-linear com bootstrapping
          </p>
        </div>
      </div>

      {/* Gráfico Visual: Peso e Importância das Features da IA (Gate 4) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Gráfico de Importância das Features (Random Forest Feature Weights)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Impacto no Veto / Aprovação de cada sinal
          </span>
        </div>

        <div className="mt-6 space-y-3.5">
          {featureList.map((item, idx) => {
            const colors = [
              "bg-gradient-to-r from-cyan-500 to-teal-400",
              "bg-gradient-to-r from-teal-500 to-emerald-400",
              "bg-gradient-to-r from-purple-500 to-pink-400",
              "bg-gradient-to-r from-blue-500 to-cyan-400",
              "bg-gradient-to-r from-amber-500 to-orange-400",
              "bg-gradient-to-r from-indigo-500 to-purple-400",
              "bg-gradient-to-r from-emerald-500 to-teal-400",
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
                  <span className="font-mono font-bold text-cyan-400">{item.importance}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.max(item.importance * 3.5, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
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
            Nenhum dado gravado no dataset ainda. Conforme o robô operar na Deriv, os snapshots de
            mercado serão catalogados automaticamente aqui para calibração contínua.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-900/80 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="p-3">Ativo</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3 font-mono">ER (40)</th>
                  <th className="p-3 font-mono">R²</th>
                  <th className="p-3 font-mono">VR (Lo-Mac)</th>
                  <th className="p-3 font-mono">Imbalance</th>
                  <th className="p-3 font-mono">Volatilidade</th>
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
                    <td className="p-3 font-mono font-bold text-cyan-400">{row.symbol}</td>
                    <td className="p-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {row.contractType}
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
                    <td className="p-3 font-mono text-slate-300">{row.r2.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-300">{row.varianceRatio.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-300">
                      {(row.imbalance * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {(row.tickVolatility * 100).toFixed(2)}%
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

      {/* Como a IA Protege o Capital */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Cpu className="h-4 w-4 text-cyan-400" />
            Features Analisadas pela IA a Cada Entrada
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">1. Kaufman ER (40)</span>
              <p className="text-[10px] text-slate-400">Eficiência de tendência vs ruído</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">2. OLS R² (40)</span>
              <p className="text-[10px] text-slate-400">Ajuste da regressão linear</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">3. Lo-MacKinlay VR</span>
              <p className="text-[10px] text-slate-400">Persistência vs Random Walk</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">4. Tick Imbalance</span>
              <p className="text-[10px] text-slate-400">Micro fluxo de ordem recente</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">5. Volatilidade Realizada (σ)</span>
              <p className="text-[10px] text-slate-400">Desvio padrão de 15 ticks</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">6. Payout Ratio (R)</span>
              <p className="text-[10px] text-slate-400">Retorno percentual da Deriv</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">7. OLS Slope</span>
              <p className="text-[10px] text-slate-400">Inclinação da reta direcional</p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2.5">
              <span className="font-semibold text-slate-200">8. Hora UTC do Dia</span>
              <p className="text-[10px] text-slate-400">Ciclos do algoritmo da Deriv</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            Por que o Meta-Labeling Supera Modelos Tradicionais?
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Detecção de Armadilhas da Deriv</strong>: Se o Kaufman ER estiver alto mas
                coincidir com horários de spike falso e payout comprimido, a IA corta a entrada
                antes de tomar o loss.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Eliminação de Relações Lineares Ingênuas</strong>: A Random Forest combina
                100 árvores para encontrar padrões complexos e não-lineares no histórico.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>
                <strong>Aprendizado Contínuo</strong>: Conforme o robô opera e salva os snapshots de
                mercado no banco, você pode retreinar o cérebro em 1 clique para se adaptar às novas
                fases do algoritmo da corretora.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
