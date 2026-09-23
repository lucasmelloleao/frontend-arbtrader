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
