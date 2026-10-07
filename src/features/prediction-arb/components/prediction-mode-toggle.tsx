"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, PauseCircle, Play } from "lucide-react";

import { alternarColheita } from "@/features/prediction-arb/prediction-arb.actions";

type PredictionModeToggleProps = {
  allowLiveTrading: boolean;
  isOnline: boolean;
};

/**
 * Controle universal do topo da tela Polymarket Arb.
 * Alterna entre Modo SIMULADO (dry-run — nenhuma ordem real, nada é consumido
 * da conta) e Modo REAL (ordens reais na Polymarket), e mostra o estado do motor
 * (ON/OFF) e o PnL estimado da simulação.
 */
export function PredictionModeToggle({
  allowLiveTrading,
  isOnline,
}: PredictionModeToggleProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  const handleToggle = (): void => {
    setMensagem(null);

    // Segurança: confirmar antes de alternar para REAL
    if (!allowLiveTrading) {
      const confirmou = confirm(
        "Alternar para Modo REAL envia ordens reais para a Polymarket usando o saldo da sua wallet.\n\n" +
          "O robô vai comprar/vender pares YES+NO e comprometer capital real.\n\n" +
          "Deseja continuar?",
      );
      if (!confirmou) return;
    }

    startTransition(async () => {
      const res = await alternarColheita(!allowLiveTrading);
      if (res.ok) {
        setMensagem(null);
        router.refresh();
      } else {
        setMensagem(res.erro);
      }
    });
  };

  const isLive = allowLiveTrading;
  const modoMorto = !isOnline;

  return (
    <div className="flex flex-col items-end gap-1">
      {mensagem !== null ? (
        <span className="text-xs font-semibold text-rose-300">{mensagem}</span>
      ) : null}

      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2">
        {/* Estado do motor */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${
            modoMorto ? "text-slate-400" : isLive ? "text-rose-300" : "text-sky-300"
          }`}
          title={
            modoMorto
              ? "Motor desligado"
              : isLive
                ? "Motor LIVE (ordens reais)"
                : "Motor em simulação"
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              modoMorto
                ? "bg-slate-500"
                : isLive
                  ? "animate-pulse bg-rose-400"
                  : "animate-pulse bg-sky-400"
            }`}
          />
          {modoMorto ? "MOTOR OFF" : isLive ? "MOTOR LIVE" : "MOTOR SIMULANDO"}
        </span>

        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isLive
              ? "bg-rose-600/20 text-rose-300 border border-rose-500/50 hover:bg-rose-600/30"
              : "bg-sky-500/10 text-sky-300 border border-sky-500/40 hover:bg-sky-500/20"
          }`}
          title="Alternar entre Modo Simulado e Modo Real"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLive ? (
            <PauseCircle className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isLive ? "Modo REAL" : "Modo SIMULADO"}
        </button>

        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300">
            <AlertTriangle className="h-3 w-3" /> Ordens reais ativas
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">Dry-run — saldo real intacto</span>
        )}
      </div>
    </div>
  );
}
