import type { LucideIcon } from "lucide-react";

type StrategyCardProps = {
  /** Título da estratégia. */
  title: string;
  /** Descrição em uma ou duas frases. */
  description: string;
  /** Destaques em bullets, exibidos na base do card. */
  stats: readonly string[];
  /** Ícone da estratégia. */
  icon: LucideIcon;
  /** Classe de cor do ícone (token visual da seção). */
  iconClass: string;
  /** Classe de hover da borda. */
  hoverBorder: string;
};

/**
 * Card de estratégia: título, descrição, ícone e lista de destaques. Componente
 * de apresentação puro — sem estado, sem dados.
 */
export function StrategyCard({
  title,
  description,
  stats,
  icon: Icon,
  iconClass,
  hoverBorder,
}: StrategyCardProps): React.ReactNode {
  return (
    <div
      className={`flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-lg backdrop-blur-sm transition-all hover:translate-y-[-4px] ${hoverBorder}`}
    >
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/70">
          <Icon className={`h-8 w-8 ${iconClass}`} aria-hidden="true" />
        </div>
        <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
        <p className="mb-6 leading-relaxed text-slate-400">{description}</p>
      </div>
      <div className="border-t border-slate-800/60 pt-6">
        <ul className="space-y-2">
          {stats.map((stat) => (
            <li key={stat} className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
              {stat}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
