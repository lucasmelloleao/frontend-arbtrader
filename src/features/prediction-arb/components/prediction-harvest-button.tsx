"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AlertTriangle, Loader2, Play, Square } from "lucide-react";

import { alternarColheita } from "@/features/prediction-arb/prediction-arb.actions";

type PredictionHarvestButtonProps = {
  allowLiveTrading: boolean;
  isOnline: boolean;
};

/**
 * Botão "Iniciar Colheita" / "Parar Colheita" do robô Polymarket.
 * Alterna o modo LIVE (ordens reais) persistido no banco
 * (PredictionArbSettings.allowLiveTrading) — sem variável de ambiente.
 */
export function PredictionHarvestButton({
  allowLiveTrading,
  isOnline,
}: PredictionHarvestButtonProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  const handleToggle = (): void => {
    setMensagem(null);

    if (!allowLiveTrading) {
      // Confirmação de segurança antes de operar com dinheiro real
      const confirmou = confirm(
        "Iniciar Colheita coloca ordens REAIS na Polymarket usando o saldo da sua wallet.\n\n" +
          "O robô vai comprar pares YES+NO quando houver spread e vendê-los no take-profit.\n\n" +
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

  return (
    <div className="flex flex-col items-end gap-1">
      {mensagem !== null ? (
        <span className="text-xs font-semibold text-rose-300">{mensagem}</span>
      ) : null}
      <button
        type="button"
        disabled={isPending || !isOnline}
        onClick={handleToggle}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          allowLiveTrading
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
        }`}
        title={
          isOnline
            ? allowLiveTrading
              ? "Parar colheita — volta para modo simulação (dry-run)"
              : "Iniciar colheita — passa a operar com ordens reais"
            : "Robô offline — inicie o bot antes de colher"
        }
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : allowLiveTrading ? (
          <Square className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        {allowLiveTrading ? "Parar Colheita" : "Iniciar Colheita"}
      </button>
      {allowLiveTrading ? (
        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Modo LIVE — ordens reais ativas
        </span>
      ) : (
        <span className="text-[10px] text-slate-500">Modo simulação (dry-run)</span>
      )}
    </div>
  );
}
