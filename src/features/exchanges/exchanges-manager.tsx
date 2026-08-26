"use client";

import { useState } from "react";

import { Pencil, Plus, X } from "lucide-react";

import { ExchangeForm } from "@/features/exchanges/exchange-form";
import { ExchangeList } from "@/features/exchanges/exchange-list";
import type { Exchange } from "@/features/exchanges/exchanges.schema";

type ExchangesManagerProps = {
  exchanges: readonly Exchange[];
};

/**
 * Orquestra a tela de exchanges: segura a conexão em edição e o estado de
 * abertura do formulário de criação. O botão "Nova Exchange" abre o form; ao
 * clicar em editar na lista, o form abre pré-preenchido. O dado chega do RSC
 * via prop; as mutações revalidam no servidor.
 */
export function ExchangesManager({ exchanges }: ExchangesManagerProps): React.ReactNode {
  const [editando, setEditando] = useState<Exchange | null>(null);
  const [criando, setCriando] = useState(false);

  const abrirCriacao = (): void => {
    setEditando(null);
    setCriando(true);
  };

  const abrirEdicao = (exchange: Exchange): void => {
    setEditando(exchange);
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
        <h3 className="flex items-center gap-3 text-2xl font-bold text-white">
          Integrações de Exchange
        </h3>
        {!formAberto ? (
          <button
            type="button"
            onClick={abrirCriacao}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Nova Exchange
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExchangeList
          exchanges={exchanges}
          onEditar={abrirEdicao}
          editandoId={editando?.id ?? null}
        />
      </div>

      {formAberto ? (
        <div className="max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-lg font-medium text-white">
              {editando === null ? (
                <Plus className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              ) : (
                <Pencil className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              )}
              {editando === null
                ? "Registrar Nova Chave de API"
                : `Editar Conexão: ${editando.nome}`}
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
          {/* `key` remonta o form quando a conexão em edição muda (ou volta a
              criar): o `defaultValues` do RHF só vale na primeira montagem. */}
          <ExchangeForm key={editando?.id ?? "novo"} editando={editando} aoSalvo={fecharForm} />
        </div>
      ) : null}
    </div>
  );
}
