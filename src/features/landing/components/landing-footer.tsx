import { Zap } from "lucide-react";

/** Ano do copyright: constante para o prerender ficar estável (sem `new Date()`). */
const ANO_COPYRIGHT = 2026;

/**
 * Rodapé da landing: marca e aviso de direitos.
 */
export function LandingFooter(): React.ReactNode {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="mx-auto max-w-7xl px-4 text-center text-slate-500 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Zap className="h-5 w-5 text-indigo-500/50" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight text-slate-400">Arbtrader</span>
        </div>
        <p>© {ANO_COPYRIGHT} Arbtrader. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
