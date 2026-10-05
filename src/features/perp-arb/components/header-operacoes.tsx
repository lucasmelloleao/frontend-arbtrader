"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RefreshCw } from "lucide-react";

import { atualizarSettings, buscarBotStatus } from "@/features/perp-arb/perp-arb.actions";
import type { PerpArbSettings } from "@/features/perp-arb/perp-arb.schema";

type HeaderOperacoesProps = {
  settings: PerpArbSettings;
};

/** Estado do robô: online (heartbeat) + scanner ativo. Preenchido via polling. */
type EstadoBot = {
  isOnline: boolean;
  isScanningEnabled: boolean;
};

/**
 * Cabeçalho da arbitragem de funding: título + tag de status do robô + botão
 * "Iniciar/Parar Colheita". Componente client porque muta as configurações via
 * Server Action + `router.refresh` e faz polling do `/bot-status` a cada 10s
 * (refletindo o heartbeat real do robô).
 */
export function HeaderOperacoes({ settings }: HeaderOperacoesProps): React.ReactNode {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  // Começa com o valor gravado nas configurações; o polling do `/bot-status`
  // sobrepõe com o estado vivo assim que responde.
  const [bot, setBot] = useState<EstadoBot>({
    isOnline: settings.isScanningEnabled,
    isScanningEnabled: settings.isScanningEnabled,
  });

  useEffect(() => {
    let ativo = true;
    const buscar = async (): Promise<void> => {
      try {
        const resultado = await buscarBotStatus();
        if (!ativo || !resultado.ok) return;
        setBot({
          isOnline: resultado.dados.isOnline,
          isScanningEnabled: resultado.dados.isScanningEnabled,
        });
      } catch {
        // Backend lento/indisponível: mantém o último estado; o próximo
        // polling tenta de novo (sem unhandledRejection no browser).
      }
    };
    void buscar();
    const intervalo = setInterval(() => void buscar(), 10000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, []);

  const alternarColheita = async (): Promise<void> => {
    setEnviando(true);
    // Payload só com os campos do contrato de atualização (evita rebocar campos
    // de leitura como `lastScannedAt`/`allowedExchanges` que o input não aceita).
    await atualizarSettings({
      isScanningEnabled: !bot.isScanningEnabled,
      tradeSize: settings.tradeSize,
      minFundingRatePct: settings.minFundingRatePct,
      minVolume24hUSD: settings.minVolume24hUSD,
      maxDailyLoss: settings.maxDailyLoss,
      maxPortfolioCapUSD: settings.maxPortfolioCapUSD,
      maxSlippagePct: settings.maxSlippagePct,
      closeWhileFundingPositive: settings.closeWhileFundingPositive,
      spreadCloseThresholdPct: settings.spreadCloseThresholdPct,
      spreadCloseForcePct: settings.spreadCloseForcePct,
      targetProfitPct: settings.targetProfitPct,
      profitTrailingDropPct: settings.profitTrailingDropPct,
    });
    setEnviando(false);
    router.refresh();
  };

  const operante = bot.isOnline;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Arbitragem de Taxa de Funding</h1>
        <p className="mt-1 text-sm text-slate-400">
          Estratégia delta-neutra: Long no Spot + Short no Perpétuo para receber taxas de funding
          com risco zero de mercado.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            operante
              ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "border border-red-500/40 bg-red-500/20 text-red-300"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${operante ? "animate-pulse bg-emerald-400" : "bg-red-400"}`}
          />
          {operante ? "BOT OPERANTE" : "BOT OFFLINE"}
        </span>

        <button
          type="button"
          disabled={enviando}
          onClick={() => void alternarColheita()}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all shadow-lg disabled:opacity-50 ${
            bot.isScanningEnabled
              ? "border border-amber-400 bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          }`}
        >
          {enviando ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Carregando...
            </>
          ) : (
            <>
              {bot.isScanningEnabled ? (
                <>
                  <span className="h-2 w-2 animate-ping rounded-full bg-slate-950" /> 🛑 Parar
                  Colheita (Ativa)
                </>
              ) : (
                <>🌾 Iniciar Colheita</>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
