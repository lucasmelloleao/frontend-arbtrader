"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Play, Square } from "lucide-react";

import { salvarSettings } from "@/features/forex-arb/forex-arb.actions";
import type { ForexArbSettings } from "@/features/forex-arb/forex-arb.schema";

type ForexScannerButtonProps = {
  settings: ForexArbSettings | null;
};

/**
 * Botão Iniciar/Parar Scanner do robô de Scalping Forex, exibido no topo da página.
 */
export function ForexScannerButton({ settings }: ForexScannerButtonProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const ativo = settings?.isScanningEnabled ?? false;

  const alternar = (): void => {
    setErro(null);
    startTransition(async () => {
      const base = settings ?? {
        isScanningEnabled: false,
        tradeSize: 100,
        maxDailyLoss: 10,
        autoExecute: true,
      };

      const payload = {
        ...base,
        isScanningEnabled: !ativo,
        autoExecute: true,
      };

      const resultado = await salvarSettings(payload);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      router.refresh();
    });
  };

  const labelBotao = ativo ? "Parar Scalping" : "Iniciar Scalping";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={alternar}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          ativo
            ? "bg-amber-600 text-white hover:bg-amber-500"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        {ativo ? (
          <Square className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        {labelBotao}
      </button>
      {erro !== null ? (
        <span className="max-w-[220px] text-xs text-red-400" role="alert">
          {erro}
        </span>
      ) : null}
    </div>
  );
}
