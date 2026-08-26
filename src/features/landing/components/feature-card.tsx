import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  /** Título do benefício. */
  title: string;
  /** Descrição do benefício. */
  description: string;
  /** Ícone do benefício. */
  icon: LucideIcon;
  /** Classe de cor do ícone (token visual da seção). */
  iconClass: string;
};

/**
 * Card de benefício: ícone, título e descrição. Componente de apresentação
 * puro, sem estado.
 */
export function FeatureCard({
  title,
  description,
  icon: Icon,
  iconClass,
}: FeatureCardProps): React.ReactNode {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-sm transition-colors hover:border-slate-700">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
        <Icon className={`h-6 w-6 ${iconClass}`} aria-hidden="true" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
      <p className="leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
