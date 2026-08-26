"use client";

import { useState } from "react";

import { HelpCircle } from "lucide-react";

import { HelpModal } from "@/shared/ui/help-modal";

/**
 * Botão "Ajuda" do cabeçalho: folha interativa que abre o modal de como operar.
 *
 * O estado de aberto/fechado vive aqui (colocation mínimo). O modal é renderizado
 * condicionalmente só quando aberto.
 */
export function HelpButton(): React.ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        Ajuda
      </button>
      {open ? <HelpModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
