"use client";

import { useEffect, useRef } from "react";

import { X } from "lucide-react";

/** Uma colheita de funding: valor creditado e quando (rate opcional). */
export type FundingHarvest = {
  amount: number;
  timestamp: string;
  fundingRate: number | null;
};

type FundingHarvestsDialogProps = {
  /** Lista de colheitas do extrato, na ordem em que aparecem. */
  harvests: readonly FundingHarvest[];
  onClose: () => void;
};

/** Formata a data como no painel legado (`dd/mm hh:mm:ss`). */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Modal "Extrato de Colheitas": lista os fundings coletados de um card de
 * posição (aberta ou encerrada). Sprone uma linha por colheita com data e
 * valor, no mesmo espírito do extrato do painel legado.
 *
 * Usa o `<dialog>` nativo via `showModal()` (foco, foco-trap, Escape e
 * `aria-modal` de graça). Clique no backdrop fecha — checado por coordenadas,
 * não por propagação, para não fechar ao interagir com o conteúdo.
 */
export function FundingHarvestsDialog({
  harvests,
  onClose,
}: FundingHarvestsDialogProps): React.ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null || dialog.open) {
      return;
    }
    dialog.showModal();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return undefined;
    }
    const handleBackdropClick = (event: MouseEvent): void => {
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        onClose();
      }
    };
    const handleClose = (): void => onClose();
    dialog.addEventListener("click", handleBackdropClick);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  const total = harvests.reduce((acc, h) => acc + h.amount, 0);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950 text-slate-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-cyan-300">
          🌾 Extrato de Colheitas ({harvests.length})
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fechar extrato de colheitas"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-3">
        {harvests.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            Nenhuma colheita registrada nesta operação.
          </p>
        ) : (
          <div className="space-y-1">
            {harvests.map((h) => (
              <div
                key={`${h.timestamp}-${h.amount}`}
                className="flex items-center justify-between rounded-lg px-3 py-1.5 font-mono text-[11px] hover:bg-white/5"
              >
                <div className="flex flex-col">
                  <span className="text-slate-400">{formatTimestamp(h.timestamp)}</span>
                  {h.fundingRate !== null ? (
                    <span className="text-[10px] text-cyan-500/70">
                      Rate: {h.fundingRate.toFixed(4)}%
                    </span>
                  ) : null}
                </div>
                <span className="font-bold text-emerald-400">+{h.amount.toFixed(4)} USDT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
        <span className="text-xs font-semibold text-slate-400">Total Coletado</span>
        <span className="font-mono text-sm font-bold text-cyan-300">+{total.toFixed(4)} USDT</span>
      </div>
    </dialog>
  );
}
