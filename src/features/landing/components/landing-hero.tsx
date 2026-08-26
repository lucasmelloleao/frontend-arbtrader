import Link from "next/link";

import { ArrowRight } from "lucide-react";

/**
 * Hero da landing: a primeira dobra. CTA primário leva ao login; o secundário
 * ancora nas estratégias (mesma página).
 */
export function LandingHero(): React.ReactNode {
  return (
    <section className="relative overflow-hidden pb-32 pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          4 Motores Algorítmicos Ativos em Produção
        </div>
        <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          Negociação Quantitativa de <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Alta Performance &amp; Zero Risco
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-slate-400">
          Explore ineficiências de mercado em tempo real através de inteligência artificial
          aplicada. De arbitragem de taxas futuros-à-vista à liquidação instantânea por flash loans.
          Você foca na estratégia, nossos algoritmos fazem o resto.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 sm:w-auto"
          >
            Acessar Painel de Operações <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <a
            href="#strategies"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-8 py-3.5 text-lg font-medium text-white transition-all hover:bg-slate-700 sm:w-auto"
          >
            Explorar Estratégias
          </a>
        </div>
      </div>
    </section>
  );
}
