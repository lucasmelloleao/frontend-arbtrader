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
 * Botão Iniciar/Parar Scanner do robô Forex, exibido no topo da página. Faz o
 * POST de settings via Server Action e reflete o estado com `router.refresh`.
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
        minProfitPct: 0.05,
        minVolume24hUSD: 50000,
        maxStrategiesPerScan: 5,
        scanIntervalMs: 60000,
        maxDailyLoss: 10,
        maxSlippagePct: 0.1,
        autoExecute: true,
        simpleEnabled: true,
        triangularEnabled: true,
        allowedExchanges: [],
      };
      const resultado = await salvarSettings({ ...base, isScanningEnabled: !ativo });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      router.refresh();
    });
  };

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
        {ativo ? "Parar Scanner" : "Iniciar Scanner"}
      </button>
      {erro !== null ? (
        <span className="max-w-[220px] text-xs text-red-400" role="alert">
          {erro}
        </span>
      ) : null}
    </div>
  );
}
