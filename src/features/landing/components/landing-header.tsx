import Link from "next/link";

import { Zap } from "lucide-react";

import { HelpButton } from "@/features/landing/components/help-button";

/**
 * Cabeçalho fixo da landing: marca + ações (ajuda e acesso à plataforma).
 *
 * Componente de servidor: não há interatividade própria — o único elemento
 * interativo é o `HelpButton`, que é a folha client da árvore.
 */
export function LandingHeader(): React.ReactNode {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-indigo-500" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-white">ArbTrade</span>
        </div>
        <div className="flex items-center gap-3">
          <HelpButton />
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700"
          >
            Acessar Plataforma
          </Link>
        </div>
      </div>
    </nav>
  );
}
