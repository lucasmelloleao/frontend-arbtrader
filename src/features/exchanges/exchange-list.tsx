"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Key, Pencil, Trash2 } from "lucide-react";

import { deletarExchange } from "@/features/exchanges/exchanges.actions";
import type { Exchange } from "@/features/exchanges/exchanges.schema";
import { SUPPORTED_CEX } from "@/shared/constants/supported-cex";

type ExchangeListProps = {
  exchanges: readonly Exchange[];
  /** Callback ao clicar em editar. */
  onEditar: (exchange: Exchange) => void;
  /** Id da conexão em edição (para destacar o card). */
  editandoId: string | null;
};

/** Resolve o nome amigável da corretora a partir do id (registry const). */
function nomeCorretora(exchangeId: string): string {
  return SUPPORTED_CEX.find((cex) => cex.id === exchangeId)?.nome ?? exchangeId;
}

/**
 * Lista de conexões CEX registradas. Cada card mostra o nome, a corretora e a
 * chave mascarada, com ações de editar e excluir (Server Actions +
 * `router.refresh`).
 */
export function ExchangeList({
  exchanges,
  onEditar,
  editandoId,
}: ExchangeListProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (exchanges.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
        Nenhuma integração registrada. Adicione uma abaixo.
      </div>
    );
  }

  const remover = (id: string): void => {
    if (!confirm("Tem certeza que deseja excluir esta chave de API?")) {
      return;
    }
    startTransition(async () => {
      await deletarExchange(id);
      router.refresh();
    });
  };

  return (
    <>
      {exchanges.map((exchange) => {
        const emEdicao = exchange.id === editandoId;
        return (
          <div
            key={exchange.id}
            className={`rounded-xl border bg-slate-900 p-5 shadow-sm transition-colors hover:border-slate-700 ${
              emEdicao ? "border-indigo-500/60" : "border-slate-800"
            }`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="flex items-center gap-3 text-lg font-bold text-white">
                  {exchange.nome}
                  <span className="rounded border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-400">
                    {nomeCorretora(exchange.exchangeId)}
                  </span>
                </h4>
                <p className="mt-2 font-mono text-xs text-slate-400">
                  Chave: {exchange.apiKey.slice(0, 8)}...{exchange.apiKey.slice(-4)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEditar(exchange)}
                  disabled={isPending}
                  className="rounded-md bg-slate-800/50 p-1 text-slate-600 transition-colors hover:text-indigo-400 disabled:opacity-50"
                  aria-label={`Editar conexão ${exchange.nome}`}
                  title="Editar conexão"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => remover(exchange.id)}
                  disabled={isPending}
                  className="rounded-md bg-slate-800/50 p-1 text-slate-600 transition-colors hover:text-red-400 disabled:opacity-50"
                  aria-label={`Excluir conexão ${exchange.nome}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-4 text-xs text-slate-500">
              <span>Conectada</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Key className="h-3 w-3" aria-hidden="true" />
                Segredo Criptografado
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
