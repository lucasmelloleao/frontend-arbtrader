"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Trash2 } from "lucide-react";

import { limparHistoricoPrediction } from "@/features/prediction-arb/prediction-arb.actions";

/**
 * Botão para limpar/zerar todo o histórico de operações e estratégias
 * da Polymarket do banco de dados (DELETE /prediction-arb/trades).
 */
export function PredictionClearHistoryButton(): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClear = (): void => {
    if (
      !confirm(
        "Deseja realmente apagar TODAS as estratégias e o histórico de operações do banco de dados da Polymarket para recomeçar?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await limparHistoricoPrediction();
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.erro);
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClear}
      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50 transition-all"
      title="Zerar banco de dados e histórico de operações da Polymarket"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      {isPending ? "Limpando..." : "Limpar Banco"}
    </button>
  );
}
