"use client";

import { useState } from "react";

import { Pencil, Plus, X } from "lucide-react";

import { StrategyCard } from "@/features/perp-arb/components/strategy-card";
import { StrategyForm } from "@/features/perp-arb/components/strategy-form";
import type { PerpArbStrategy } from "@/features/perp-arb/perp-arb.schema";

/** Chave de corretora disponível para o form (nome + id). */
export type ExchangeOption = {
  id: string;
  nome: string;
};

type StrategiesManagerProps = {
  strategies: readonly PerpArbStrategy[];
  /** Corretoras cadastradas (para os seletores do form). */
  exchanges: readonly ExchangeOption[];
};

/**
 * Orquestra a seção de estratégias: segura a estratégia em edição e o estado
 * de abertura do form de criação. Botão "Nova Estratégia" abre o form; editar
 * num card abre pré-preenchido. O dado chega do RSC via prop.
 */
export function StrategiesManager({
  strategies,
  exchanges,
}: StrategiesManagerProps): React.ReactNode {
  const [editando, setEditando] = useState<PerpArbStrategy | null>(null);
  const [criando, setCriando] = useState(false);

  const abrirCriacao = (): void => {
    setEditando(null);
    setCriando(true);
  };

  const abrirEdicao = (strategy: PerpArbStrategy): void => {
    setEditando(strategy);
    setCriando(false);
  };

  const fecharForm = (): void => {
    setEditando(null);
    setCriando(false);
  };

  const formAberto = criando || editando !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🛠️ Estratégias</h3>
        {!formAberto ? (
          <button
            type="button"
            onClick={abrirCriacao}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova Estratégia
          </button>
        ) : null}
      </div>

      {strategies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          Nenhuma estratégia criada. Clique em "Nova Estratégia" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} onEditar={abrirEdicao} />
          ))}
        </div>
      )}

      {formAberto ? (
        <div className="max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-lg font-medium text-white">
              {editando === null ? (
                <Plus className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              ) : (
                <Pencil className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              )}
              {editando === null ? "Nova Estratégia" : `Editar: ${editando.nome}`}
            </h4>
            <button
              type="button"
              onClick={fecharForm}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Fechar formulário"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {/* `key` remonta o form quando a estratégia em edição muda. */}
          <StrategyForm
            key={editando?.id ?? "novo"}
            editando={editando}
            aoSalvo={fecharForm}
            exchanges={exchanges}
          />
        </div>
      ) : null}
    </div>
  );
}
