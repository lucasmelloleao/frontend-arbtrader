"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { atualizarStrategy, criarStrategy } from "@/features/perp-arb/perp-arb.actions";
import {
  strategyFormSchema,
  type PerpArbStrategy,
  type StrategyFormInput,
} from "@/features/perp-arb/perp-arb.schema";
import type { ExchangeOption } from "@/features/perp-arb/strategies-manager";

type StrategyFormProps = {
  /** Estratégia em edição (null = criar). */
  editando: PerpArbStrategy | null;
  /** Disparado após salvar (para fechar o form). */
  aoSalvo?: () => void;
  /** Corretoras cadastradas (seletores Perp/Spot). */
  exchanges: readonly ExchangeOption[];
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

const VALORES_INICIAIS: StrategyFormInput = {
  id: "",
  nome: "",
  perpSymbol: "",
  spotSymbol: "",
  tradeSize: 100,
  minFundingRatePct: 0.0001,
  maxSlippagePct: 0.005,
  maxDailyLoss: 50,
  cooldownAfterLossMs: 300000,
  perpExchangeKeyId: "",
  spotExchangeKeyId: "",
  exchangeKeyId: "",
  ativo: true,
  autoExecute: true,
  autoClose: true,
  fundingTargetPct: 0.0002,
  maxHoldHours: 72,
  resetCooldown: false,
};

/**
 * Formulário de estratégia de funding arb (criar/editar). UI com RHF +
 * valibot (schema único); a mutação é a Server Action correspondente, que
 * decide o payload.
 */
export function StrategyForm({ editando, aoSalvo, exchanges }: StrategyFormProps): React.ReactNode {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const form = useForm<StrategyFormInput>({
    resolver: valibotResolver(strategyFormSchema),
    defaultValues:
      editando === null
        ? VALORES_INICIAIS
        : {
            id: editando.id,
            nome: editando.nome,
            perpSymbol: editando.perpSymbol,
            spotSymbol: editando.spotSymbol,
            tradeSize: editando.tradeSize,
            minFundingRatePct: editando.minFundingRatePct,
            maxSlippagePct: editando.maxSlippagePct,
            maxDailyLoss: editando.maxDailyLoss,
            cooldownAfterLossMs: editando.cooldownAfterLossMs,
            perpExchangeKeyId: editando.perpExchangeKeyId ?? "",
            spotExchangeKeyId: editando.spotExchangeKeyId ?? "",
            exchangeKeyId: editando.exchangeKeyId ?? "",
            ativo: editando.ativo,
            autoExecute: editando.autoExecute,
            autoClose: editando.autoClose,
            fundingTargetPct: editando.fundingTargetPct,
            maxHoldHours: editando.maxHoldHours,
            resetCooldown: false,
          },
  });
  const { register, formState } = form;

  const enviar = form.handleSubmit(async (valores) => {
    setErroServidor(null);
    const resultado =
      editando === null
        ? await criarStrategy({
            nome: valores.nome,
            perpSymbol: valores.perpSymbol,
            spotSymbol: valores.spotSymbol,
            tradeSize: valores.tradeSize,
            minFundingRatePct: valores.minFundingRatePct,
            maxSlippagePct: valores.maxSlippagePct,
            maxDailyLoss: valores.maxDailyLoss,
            cooldownAfterLossMs: valores.cooldownAfterLossMs,
            perpExchangeKeyId: valores.perpExchangeKeyId,
            spotExchangeKeyId: valores.spotExchangeKeyId,
            exchangeKeyId: valores.exchangeKeyId,
            ativo: valores.ativo,
          })
        : await atualizarStrategy(valores);
    if (!resultado.ok) {
      setErroServidor(resultado.erro);
      return;
    }
    form.reset(VALORES_INICIAIS);
    router.refresh();
    aoSalvo?.();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label htmlFor="strategy-nome" className={ROTULO_CLASS}>
            Nome
          </label>
          <input
            id="strategy-nome"
            className={CAMPO_CLASS}
            placeholder="Ex: Funding MEXC BTC"
            aria-invalid={formState.errors.nome !== undefined}
            {...register("nome")}
          />
          {formState.errors.nome ? (
            <p role="alert" className="mt-1 text-sm text-red-500">
              {formState.errors.nome.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="strategy-spot" className={ROTULO_CLASS}>
            Símbolo Spot
          </label>
          <input
            id="strategy-spot"
            className={CAMPO_CLASS}
            placeholder="BTC/USDT"
            {...register("spotSymbol")}
          />
        </div>
        <div>
          <label htmlFor="strategy-perp" className={ROTULO_CLASS}>
            Símbolo Perpétuo
          </label>
          <input
            id="strategy-perp"
            className={CAMPO_CLASS}
            placeholder="BTC/USDT:USDT"
            {...register("perpSymbol")}
          />
        </div>
        <div>
          <label htmlFor="strategy-trade" className={ROTULO_CLASS}>
            Tamanho do Trade (USDT)
          </label>
          <input
            id="strategy-trade"
            type="number"
            step="any"
            className={CAMPO_CLASS}
            {...register("tradeSize", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="strategy-funding" className={ROTULO_CLASS}>
            Funding Mínimo (%)
          </label>
          <input
            id="strategy-funding"
            type="number"
            step="any"
            className={CAMPO_CLASS}
            {...register("minFundingRatePct", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="strategy-slippage" className={ROTULO_CLASS}>
            Slippage Máx. (%)
          </label>
          <input
            id="strategy-slippage"
            type="number"
            step="any"
            className={CAMPO_CLASS}
            {...register("maxSlippagePct", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="strategy-loss" className={ROTULO_CLASS}>
            Perda Diária Máx. (USDT)
          </label>
          <input
            id="strategy-loss"
            type="number"
            step="any"
            className={CAMPO_CLASS}
            {...register("maxDailyLoss", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="strategy-cooldown" className={ROTULO_CLASS}>
            Cooldown após perda (ms)
          </label>
          <input
            id="strategy-cooldown"
            type="number"
            step="60000"
            className={CAMPO_CLASS}
            {...register("cooldownAfterLossMs", { valueAsNumber: true })}
          />
        </div>
        <div className="col-span-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Corretoras
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="strategy-perp-exchange" className={ROTULO_CLASS}>
                Perp Exchange <span className="text-slate-600">(SHORT)</span>
              </label>
              <select
                id="strategy-perp-exchange"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                {...register("perpExchangeKeyId")}
              >
                <option value="">— Selecionar —</option>
                {exchanges.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="strategy-spot-exchange" className={ROTULO_CLASS}>
                Spot Exchange <span className="text-slate-600">(LONG hedge)</span>
              </label>
              <select
                id="strategy-spot-exchange"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                {...register("spotExchangeKeyId")}
              >
                <option value="">— Selecionar —</option>
                {exchanges.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {exchanges.length === 0 ? (
            <p className="mt-2 text-xs text-amber-400">
              Nenhuma corretora cadastrada. Registre chaves em Exchange primeiro.
            </p>
          ) : null}
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-indigo-500" {...register("ativo")} />
            Estratégia ativa
          </label>
        </div>
      </div>

      {erroServidor === null ? null : (
        <p
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erroServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {formState.isSubmitting
          ? "Salvando..."
          : editando === null
            ? "Criar Estratégia"
            : "Salvar Alterações"}
      </button>
    </form>
  );
}
