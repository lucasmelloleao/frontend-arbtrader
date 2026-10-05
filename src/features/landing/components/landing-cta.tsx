import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";

/**
 * CTA final: chamada direta e convincente para ativar o Robô Deriv.
 */
export function LandingCta(): React.ReactNode {
  return (
    <section className="relative overflow-hidden py-24 text-center">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-cyan-950/20 to-transparent" />
      <div className="mx-auto max-w-4xl px-4">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20">
          <Bot className="h-8 w-8" />
        </div>
        <h2 className="mb-6 text-3xl sm:text-5xl font-extrabold text-white">
          Pronto para operar com a máxima inteligência na Deriv?
        </h2>
        <p className="mb-10 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
          Conecte seu token de API em menos de 1 minuto, ative os 4 filtros de proteção e deixe o
          robô quantitativo buscar as melhores oportunidades para você.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-lg font-bold text-slate-950 shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-cyan-500/50"
        >
          Acessar Robô Deriv Agora <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
