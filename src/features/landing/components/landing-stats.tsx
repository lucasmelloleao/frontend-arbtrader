/**
 * Barra de estatísticas de mercado (marketing estático da landing).
 *
 * Os números são placeholder da campanha: a landing não tem acesso a dado de
 * produção — leitura de dado real é RSC autenticado, fora do escopo da página
 * pública. Mantidos como estão para fidelidade ao original.
 */
const STATS = [
  { label: "Volume Arbitrado (24h)", value: "$4,852,192.40", color: "text-indigo-400" },
  { label: "Liquidações Executadas", value: "1,492 transações", color: "text-cyan-400" },
  { label: "Tempo Médio de Varredura", value: "< 4.2ms", color: "text-purple-400" },
  { label: "Sucesso Histórico", value: "99.87%", color: "text-emerald-400" },
] as const;

/**
 * Faixa de estatísticas ao vivo (estáticas na landing) entre o hero e as
 * estratégias.
 */
export function LandingStats(): React.ReactNode {
  return (
    <section className="border-y border-slate-800/80 bg-slate-900/30 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-extrabold md:text-3xl ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
