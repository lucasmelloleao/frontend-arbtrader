import Link from "next/link";

import { ArrowRight } from "lucide-react";

/**
 * CTA final: converte o visitante para o login (painel de controle).
 */
export function LandingCta(): React.ReactNode {
  return (
    <section className="relative overflow-hidden py-24 text-center">
      <div className="absolute inset-0 -z-10 bg-indigo-900/10" />
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-6 text-4xl font-extrabold text-white">
          Pronto para colocar as estratégias para trabalhar por você?
        </h2>
        <p className="mb-10 text-xl text-slate-400">
          Conecte suas chaves de API, configure seus limites e assista aos robôs quantitativos
          operando de forma delta-neutra.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-600"
        >
          Iniciar Painel de Controle <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
