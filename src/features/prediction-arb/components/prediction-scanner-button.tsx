"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { RefreshCw, Search } from "lucide-react";

import { executarManualScan } from "@/features/prediction-arb/prediction-arb.actions";
import type { PredictionArbSettings } from "@/features/prediction-arb/prediction-arb.schema";

type PredictionScannerButtonProps = {
  settings: PredictionArbSettings | null;
};

/**
 * Botão para disparar o scan manual na Gamma API da Polymarket.
 */
export function PredictionScannerButton({
  settings,
}: PredictionScannerButtonProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  const scannerAtivo = settings?.isScanningEnabled ?? false;

  const handleScan = (): void => {
    setMensagem(null);
    startTransition(async () => {
      const res = await executarManualScan();
      if (res.ok) {
        setMensagem("Scan concluído!");
        router.refresh();
      } else {
        setMensagem(res.erro);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {mensagem !== null ? (
        <span className="text-xs font-semibold text-indigo-300">{mensagem}</span>
      ) : null}
      <button
        type="button"
        disabled={isPending}
        onClick={handleScan}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
          scannerAtivo
            ? "border border-indigo-500/40 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30"
            : "bg-indigo-600 text-white hover:bg-indigo-500"
        } disabled:opacity-50`}
        title="Executar varredura manual de mercados na Gamma API"
      >
        {isPending ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {isPending ? "Escaneando..." : "Scan Manual"}
      </button>
    </div>
  );
}
