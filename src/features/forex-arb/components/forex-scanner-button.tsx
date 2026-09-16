"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Play, Square } from "lucide-react";

import { salvarSettings } from "@/features/forex-arb/forex-arb.actions";
import type { ForexArbSettings } from "@/features/forex-arb/forex-arb.schema";

type ForexScannerButtonProps = {
  settings: ForexArbSettings | null;
  mode?: "grid" | "scalping";
};

/**
 * Botão Iniciar/Parar Scanner do robô Forex (Scalping ou Trend Grid), exibido no topo da página.
 */
export function ForexScannerButton({
  settings,
  mode = "scalping",
}: ForexScannerButtonProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const isGridMode = mode === "grid";
  const ativo = isGridMode
    ? (settings?.gridEnabled ?? true)
    : (settings?.isScanningEnabled ?? false);

  const alternar = (): void => {
    setErro(null);
    startTransition(async () => {
      const base = settings ?? {
        isScanningEnabled: false,
        gridEnabled: true,
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

      const payload = isGridMode
        ? { ...base, gridEnabled: !ativo }
        : { ...base, isScanningEnabled: !ativo };

      const resultado = await salvarSettings(payload);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      router.refresh();
    });
  };

  const labelBotao = isGridMode
    ? ativo
      ? "Parar Trend Grid"
      : "Iniciar Trend Grid"
    : ativo
      ? "Parar Scalping"
      : "Iniciar Scalping";

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
