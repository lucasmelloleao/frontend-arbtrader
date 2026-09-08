"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Link2,
  Pause,
  Pencil,
  Play,
  Plus,
  Shield,
  TimerReset,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  atualizarStrategy,
  aumentarAporte,
  deletarStrategy,
  fecharStrategy,
  voidCloseStrategy,
  type MutacaoResult,
} from "@/features/perp-arb/perp-arb.actions";
import type { AtualizarStrategyInput, PerpArbStrategy } from "@/features/perp-arb/perp-arb.schema";

type StrategyCardProps = {
  strategy: PerpArbStrategy;
  /** Abre o form em modo edição. */
  onEditar: (strategy: PerpArbStrategy) => void;
};

function msToDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function cooldownStatus(strategy: PerpArbStrategy): { active: boolean; remainingMs: number } {
  if (!strategy.cooldownAfterLossMs || !strategy.lastLossAt) {
    return { active: false, remainingMs: 0 };
  }
  const elapsed = Date.now() - new Date(strategy.lastLossAt).getTime();
  const remaining = strategy.cooldownAfterLossMs - elapsed;
  return { active: remaining > 0, remainingMs: Math.max(0, remaining) };
}

/** Monta o payload de atualização a partir da estratégia atual com as mudanças dadas. */
function payloadAtualizacao(
  strategy: PerpArbStrategy,
  mudancas: Partial<{
    ativo: boolean;
    autoExecute: boolean;
    resetCooldown: boolean;
  }>,
): AtualizarStrategyInput {
  return {
    id: strategy.id,
    nome: strategy.nome,
    perpSymbol: strategy.perpSymbol,
    spotSymbol: strategy.spotSymbol,
    tradeSize: strategy.tradeSize,
    minFundingRatePct: strategy.minFundingRatePct,
    maxSlippagePct: strategy.maxSlippagePct,
    maxDailyLoss: strategy.maxDailyLoss,
    cooldownAfterLossMs: strategy.cooldownAfterLossMs,
    perpExchangeKeyId: strategy.perpExchangeKeyId ?? "",
    spotExchangeKeyId: strategy.spotExchangeKeyId ?? "",
    exchangeKeyId: strategy.exchangeKeyId ?? "",
    ativo: mudancas.ativo ?? strategy.ativo,
    autoExecute: mudancas.autoExecute ?? strategy.autoExecute,
    autoClose: strategy.autoClose,
    fundingTargetPct: strategy.fundingTargetPct,
    maxHoldHours: strategy.maxHoldHours,
    resetCooldown: mudancas.resetCooldown ?? false,
  };
}

/**
 * Card de estratégia de funding arb: status (Ativa/Auto), funding atual, perda
 * diária com barra, proteções expansíveis, cooldown com reset e ações (fechar,
 * aumentar aporte, encerrada pela corretora, auto execute, ativar/pausar,
 * editar, excluir). Mutações via Server Actions + `router.refresh`.
 */
export function StrategyCard({ strategy, onEditar }: StrategyCardProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [mostrarAporte, setMostrarAporte] = useState(false);
  const [valorAporte, setValorAporte] = useState("");

  const fundingNow = strategy.currentFundingRate;
  const fundingAboveMin = fundingNow !== null && fundingNow >= strategy.minFundingRatePct;
  const cdStatus = cooldownStatus(strategy);
  const dailyLossPct =
    strategy.maxDailyLoss > 0 ? (strategy.dailyLossAccum / strategy.maxDailyLoss) * 100 : 0;

  const executar = (acao: () => Promise<MutacaoResult>): void => {
    startTransition(async () => {
      const res = await acao();
      if (!res.ok) {
        alert(res.erro);
      }
      router.refresh();
    });
  };

  const alternarAuto = (): void => {
    executar(() =>
      atualizarStrategy(payloadAtualizacao(strategy, { autoExecute: !strategy.autoExecute })),
    );
  };

  const resetarCooldown = (): void => {
    executar(() => atualizarStrategy(payloadAtualizacao(strategy, { resetCooldown: true })));
  };

  const confirmarFechar = (): void => {
    if (
      !confirm(
        `Fechar a posição de "${strategy.nome}" agora? O robô venderá o spot e recompra o perpétuo.`,
      )
    ) {
      return;
    }
    executar(() => fecharStrategy(strategy.id, strategy.perpSymbol));
  };

  const confirmarVoidClose = (): void => {
    if (
      !confirm(
        `Marcar "${strategy.nome}" como encerrada pela corretora? Nenhuma ordem será enviada.`,
      )
    ) {
      return;
    }
    executar(() => voidCloseStrategy(strategy.id, strategy.perpSymbol));
  };

  const confirmarDelete = (): void => {
    if (!confirm(`Excluir a estratégia "${strategy.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    executar(() => deletarStrategy(strategy.id));
  };

  const confirmarAporte = (): void => {
    const valor = Number(valorAporte);
    if (!valor || valor <= 0) {
      alert("Informe um valor válido em USDT.");
      return;
    }
    executar(() => aumentarAporte(strategy.id, valor));
    setValorAporte("");
    setMostrarAporte(false);
  };

  return (
    <div
      className={`rounded-xl border bg-slate-900 p-4 transition-colors ${
        cdStatus.active ? "border-amber-500/40" : "border-white/10"
      }`}
    >
      {cdStatus.active ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Em cooldown — retoma em {msToDuration(cdStatus.remainingMs)}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-100">{strategy.nome}</div>
          <div className="text-sm text-gray-400">
            {strategy.perpSymbol} / {strategy.spotSymbol}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${
              strategy.ativo
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            {strategy.ativo ? "Ativa" : "Inativa"}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${
              strategy.autoExecute
                ? "bg-cyan-500/15 text-cyan-200"
                : "bg-slate-500/15 text-slate-200"
            }`}
          >
            {strategy.autoExecute ? "Auto" : "Manual"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-gray-400 sm:grid-cols-3">
        <div>
          Trade size: <span className="text-slate-200">{strategy.tradeSize} USDT</span>
        </div>
        <div>
          Min funding: <span className="text-slate-200">{strategy.minFundingRatePct}%</span>
        </div>
        <div>
          Funding atual:{" "}
          {fundingNow !== null ? (
            <span className={fundingAboveMin ? "font-semibold text-emerald-400" : "text-slate-200"}>
              {fundingNow.toFixed(4)}%{fundingAboveMin ? " ✓" : ""}
            </span>
          ) : (
            <span className="text-gray-600">—</span>
          )}
        </div>
      </div>

      {strategy.maxDailyLoss > 0 ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Perda diária</span>
            <span className={dailyLossPct >= 80 ? "font-semibold text-red-400" : "text-gray-400"}>
              {strategy.dailyLossAccum.toFixed(2)} / {strategy.maxDailyLoss} USDT (
              {dailyLossPct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                dailyLossPct >= 80
                  ? "bg-red-500"
                  : dailyLossPct >= 50
                    ? "bg-amber-400"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, dailyLossPct)}%` }}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center gap-1.5 rounded-lg border border-white/5 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800"
      >
        <Shield className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        Proteção
        {expanded ? (
          <ChevronUp className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 text-xs text-gray-400">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              Max slippage
              <div className="mt-0.5 font-semibold text-amber-300">{strategy.maxSlippagePct}%</div>
            </div>
            <div>
              Max perda/dia
              <div className="mt-0.5 font-semibold text-amber-300">
                {strategy.maxDailyLoss} USDT
              </div>
            </div>
            <div>
              Cooldown após perda
              <div className="mt-0.5 font-semibold text-amber-300">
                {msToDuration(strategy.cooldownAfterLossMs)}
              </div>
            </div>
          </div>
          <div className="grid gap-2 border-t border-white/5 pt-2 sm:grid-cols-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 shrink-0 text-indigo-400" aria-hidden="true" />
              <span className="text-slate-500">Perp:</span>{" "}
              <span className="font-medium text-indigo-300">
                {strategy.perpExchangeKeyId ? (
                  "conectada"
                ) : (
                  <span className="italic text-slate-600">não definida</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3 shrink-0 text-indigo-400" aria-hidden="true" />
              <span className="text-slate-500">Spot:</span>{" "}
              <span className="font-medium text-indigo-300">
                {strategy.spotExchangeKeyId ? (
                  "conectada"
                ) : (
                  <span className="italic text-slate-600">não definida</span>
                )}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={alternarAuto}
          disabled={isPending}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
            strategy.autoExecute
              ? "bg-cyan-700 text-white hover:bg-cyan-600"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          {strategy.autoExecute ? (
            <>
              <Pause className="h-4 w-4" aria-hidden="true" /> Desativar auto
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden="true" /> Ativar auto
            </>
          )}
        </button>

        {cdStatus.active ? (
          <button
            type="button"
            onClick={resetarCooldown}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600/80 px-3 py-2 text-sm text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
            title="Resetar Cooldown"
          >
            <TimerReset className="h-4 w-4" aria-hidden="true" /> Resetar Cooldown
          </button>
        ) : null}

        {strategy.positionOpen ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Posição Aberta
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => onEditar(strategy)}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
          aria-label={`Editar ${strategy.nome}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={confirmarDelete}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-900 disabled:opacity-50"
          aria-label={`Excluir ${strategy.nome}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {strategy.positionOpen ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={confirmarFechar}
            disabled={isPending}
            className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            Encerrar Agora
          </button>
          <button
            type="button"
            onClick={() => setMostrarAporte((v) => !v)}
            disabled={isPending}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            + Aumentar Aporte
          </button>
          <button
            type="button"
            onClick={confirmarVoidClose}
            disabled={isPending}
            className="rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <XCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Encerrada pela Corretora
          </button>
        </div>
      ) : null}

      {mostrarAporte ? (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="0"
            value={valorAporte}
            onChange={(e) => setValorAporte(e.target.value)}
            placeholder="Valor extra em USDT"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={confirmarAporte}
            disabled={isPending}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="mr-1 inline h-4 w-4" aria-hidden="true" />
            Confirmar
          </button>
        </div>
      ) : null}
    </div>
  );
}
