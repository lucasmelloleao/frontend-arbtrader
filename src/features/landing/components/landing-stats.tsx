/**
 * Barra de métricas quantitativas do ecossistema Deriv Bot.
 */
const STATS = [
  { label: "Velocidade de Execução", value: "< 2.4ms", color: "text-cyan-400" },
  { label: "Índices Monitorados 24/7", value: "5 Sintéticos", color: "text-teal-400" },
  { label: "Filtros de Validação", value: "4 Gates de IA", color: "text-purple-400" },
  { label: "Taxa de Assertividade", value: "Alta Precisão", color: "text-emerald-400" },
] as const;

/**
 * Faixa de estatísticas ao vivo entre o hero e as estratégias.
 */
export function LandingStats(): React.ReactNode {
  return (
    <section className="border-y border-slate-800/80 bg-slate-900/40 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-extrabold sm:text-3xl ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
