import Link from "next/link";
import { ArrowRight, Brain, Sparkles, Target, Zap } from "lucide-react";

/**
 * Hero da landing: foco total no Robô Deriv e Inteligência Artificial Quantitativa.
 */
export function LandingHero(): React.ReactNode {
  return (
    <section className="relative overflow-hidden pb-28 pt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-slate-950 to-slate-950" />

      {/* Glow de fundo */}
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-cyan-500/15 to-purple-500/15 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge de Destaque */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-cyan-300 shadow-inner backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span>Novo Motor de IA Meta-Labeling &amp; Roteamento Dinâmico Deriv</span>
        </div>

        {/* Headline Principal Convincente */}
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          O Robô Mais Inteligente da Deriv <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Operando a Favor da Probabilidade
          </span>
        </h1>

        {/* Subtítulo Marqueteiro e Convincente */}
        <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl">
          Diga adeus às apostas cegas e aos indicadores atrasados. Nosso algoritmo institucional
          escaneia múltiplos mercados sintéticos em milissegundos, encontra a melhor tendência do
          momento e só entra quando a matemática e a Inteligência Artificial confirmam vantagem
          estatística real.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-cyan-500/50 sm:w-auto"
          >
            Iniciar Robô Deriv Agora <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <a
            href="#recursos-deriv"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-slate-800 sm:w-auto"
          >
            Ver Como Funciona
          </a>
        </div>

        {/* Pilares rápidos no Hero */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left max-w-4xl mx-auto">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Roteamento Dinâmico</div>
              <div className="text-xs text-slate-400">Opera sempre no ativo mais limpo</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Barreira Otimizada</div>
              <div className="text-xs text-slate-400">Ajuste milimétrico por volatilidade</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">IA Guardiã de Risco</div>
              <div className="text-xs text-slate-400">Veta armadilhas antes do loss</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
