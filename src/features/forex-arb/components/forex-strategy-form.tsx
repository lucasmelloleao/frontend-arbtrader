"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Plus, X } from "lucide-react";

import { criarStrategy } from "@/features/forex-arb/forex-arb.actions";
import type { CriarForexStrategyInput } from "@/features/forex-arb/forex-arb.schema";
import { isCtraderId, isFixId, SUPPORTED_CEX } from "@/shared/constants/supported-cex";

type ForexStrategyFormProps = {
  /** Ids das corretoras cadastradas (para escolher a de execução). */
  exchangeIds: readonly string[];
  exchangeKeys: readonly { id: string; exchangeId: string; nome: string }[];
  onFechar: () => void;
};

/** Perna com `legKey` local estável (key do React; campo extra ignorado no payload). */
type LegComKey = CriarForexStrategyInput["legs"][number] & { legKey: number };

/** Estado do form: legs com key local. */
type FormComKey = Omit<CriarForexStrategyInput, "legs"> & { legs: LegComKey[] };

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

/**
 * Formulário de criação manual de estratégia Forex (POST /forex-arb/strategies).
 * Campos espelhando o `ForexArbStrategyCreateRequest` do swagger: nome,
 * corretora (exchangeId/exchangeKeyId), tipo (simple/triangular), pernas
 * (símbolo + lado + preço), trade size, retorno esperado e parâmetros do robô.
 */
export function ForexStrategyForm({
  exchangeIds,
  exchangeKeys,
  onFechar,
}: ForexStrategyFormProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  // `legKey` é id local estável por perna (key do React; campo extra ignorado
  // pelo schema no payload). O contador evita colisão após remoções.
  const [contadorLeg, setContadorLeg] = useState(1);
  const [form, setForm] = useState<FormComKey>(() => ({
    name: "",
    exchangeId: exchangeIds[0] ?? "ctrader",
    exchangeKeyId: "",
    type: "simple",
    legs: [{ symbol: "", side: "buy", price: null, legKey: 0 }],
    tradeSize: 100,
    expectedProfitPct: 0.05,
    minProfitPct: 0.05,
    maxSlippagePct: 0.1,
    autoExecute: true,
  }));

  const atualizar = (campo: keyof CriarForexStrategyInput, valor: unknown): void => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const atualizarLeg = (
    legKey: number,
    campo: keyof CriarForexStrategyInput["legs"][number],
    valor: unknown,
  ): void => {
    setForm((prev) => ({
      ...prev,
      legs: prev.legs.map((leg) => (leg.legKey === legKey ? { ...leg, [campo]: valor } : leg)),
    }));
  };

  const adicionarLeg = (): void => {
    setForm((prev) => ({
      ...prev,
      legs: [...prev.legs, { symbol: "", side: "buy" as const, price: null, legKey: contadorLeg }],
    }));
    setContadorLeg((c) => c + 1);
  };

  const removerLeg = (legKey: number): void => {
    setForm((prev) => ({
      ...prev,
      legs: prev.legs.filter((leg) => leg.legKey !== legKey),
    }));
  };

  const aoMudarCorretora = (exchangeId: string): void => {
    const chave = exchangeKeys.find((k) => k.exchangeId === exchangeId);
    setForm((prev) => ({
      ...prev,
      exchangeId,
      exchangeKeyId: chave?.id ?? "",
    }));
  };

  const salvar = (): void => {
    setErro(null);
    startTransition(async () => {
      // Remove o `legKey` local antes de enviar (campo extra do form).
      const payload: CriarForexStrategyInput = {
        ...form,
        legs: form.legs.map(({ legKey: ignorado, ...leg }) => leg),
      };
      const resultado = await criarStrategy(payload);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      router.refresh();
      onFechar();
    });
  };

  const corretorasDisponiveis = SUPPORTED_CEX.filter(
    (cex) => exchangeIds.includes(cex.id) || isCtraderId(cex.id) || isFixId(cex.id),
  );

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">➕ Criar Estratégia Forex</h3>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fechar formulário"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-name">
            Nome da Estratégia
          </label>
          <input
            id="fx-strategy-name"
            type="text"
            className={CAMPO_CLASS}
            placeholder="Ex: Forex-EUR/USD"
            value={form.name}
            onChange={(e) => atualizar("name", e.target.value)}
          />
        </div>
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-exchange">
            Corretora
          </label>
          <select
            id="fx-strategy-exchange"
            className={`${CAMPO_CLASS} appearance-none`}
            value={form.exchangeId}
            onChange={(e) => aoMudarCorretora(e.target.value)}
          >
            {corretorasDisponiveis.map((cex) => (
              <option key={cex.id} value={cex.id}>
                {cex.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-type">
            Tipo
          </label>
          <select
            id="fx-strategy-type"
            className={`${CAMPO_CLASS} appearance-none`}
            value={form.type}
            onChange={(e) => atualizar("type", e.target.value)}
          >
            <option value="simple">Simples</option>
            <option value="triangular">Triangular</option>
          </select>
        </div>
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-size">
            Trade Size (USDT)
          </label>
          <input
            id="fx-strategy-size"
            type="number"
            className={CAMPO_CLASS}
            value={form.tradeSize}
            onChange={(e) => atualizar("tradeSize", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-profit">
            Retorno Esperado (%)
          </label>
          <input
            id="fx-strategy-profit"
            type="number"
            step="0.01"
            className={CAMPO_CLASS}
            value={form.expectedProfitPct}
            onChange={(e) => atualizar("expectedProfitPct", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-minprofit">
            Retorno Mínimo (%)
          </label>
          <input
            id="fx-strategy-minprofit"
            type="number"
            step="0.01"
            className={CAMPO_CLASS}
            value={form.minProfitPct}
            onChange={(e) => atualizar("minProfitPct", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={ROTULO_CLASS} htmlFor="fx-strategy-slippage">
            Max Slippage (%)
          </label>
          <input
            id="fx-strategy-slippage"
            type="number"
            step="0.01"
            className={CAMPO_CLASS}
            value={form.maxSlippagePct}
            onChange={(e) => atualizar("maxSlippagePct", Number(e.target.value))}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={form.autoExecute}
              onChange={(e) => atualizar("autoExecute", e.target.checked)}
              className="rounded border-slate-600 bg-slate-800"
            />
            Execução Automática
          </label>
        </div>
      </div>

      {/* Pernas */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Pernas da Arbitragem</span>
          <button
            type="button"
            onClick={adicionarLeg}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-2 py-1 text-xs font-bold text-indigo-300 transition-colors hover:bg-indigo-600 hover:text-white"
          >
            <Plus className="h-3 w-3" aria-hidden="true" /> Adicionar Perna
          </button>
        </div>
        <div className="space-y-2">
          {form.legs.map((leg) => (
            <div key={leg.legKey} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <input
                type="text"
                className={CAMPO_CLASS}
                placeholder="Símbolo (ex: EURUSD)"
                value={leg.symbol ?? ""}
                onChange={(e) => atualizarLeg(leg.legKey, "symbol", e.target.value)}
              />
              <select
                className={`${CAMPO_CLASS} appearance-none`}
                value={leg.side ?? "buy"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "buy" || val === "sell") {
                    atualizarLeg(leg.legKey, "side", val);
                  }
                }}
              >
                <option value="buy">COMPRA</option>
                <option value="sell">VENDA</option>
              </select>
              <input
                type="number"
                step="any"
                className={CAMPO_CLASS}
                placeholder="Preço"
                value={leg.price ?? ""}
                onChange={(e) =>
                  atualizarLeg(
                    leg.legKey,
                    "price",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
              <button
                type="button"
                onClick={() => removerLeg(leg.legKey)}
                disabled={form.legs.length <= 1}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:text-red-400 disabled:opacity-30"
                aria-label={`Remover perna ${leg.symbol}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {erro !== null ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erro}
        </p>
      ) : null}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={salvar}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {isPending ? "Criando..." : "Criar Estratégia"}
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
