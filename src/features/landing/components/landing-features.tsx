import { Brain, Layers, ShieldCheck } from "lucide-react";

import { FeatureCard } from "@/features/landing/components/feature-card";

/**
 * Pilares de benefícios práticos do Robô Deriv.
 */
const FEATURES = [
  {
    title: "100% no Piloto Automático",
    description:
      "Execute estratégias quantitativas institucionais 24 horas por dia, 7 dias por semana, sem precisar acompanhar gráficos, notícias ou ter conhecimento prévio de mercado.",
    icon: Brain,
    iconClass: "text-cyan-400",
  },
  {
    title: "4 Camadas de Confirmação",
    description:
      "Nenhuma ordem é aberta ao acaso. O robô só executa operações quando 4 filtros independentes confirmam direção, força, liquidez e probabilidade favorável simultaneamente.",
    icon: Layers,
    iconClass: "text-teal-400",
  },
  {
    title: "Segurança Direta na sua Conta",
    description:
      "Seus fundos nunca saem da Deriv. O robô opera exclusivamente através de tokens de API com permissões restritas e criptografia de ponta a ponta.",
    icon: ShieldCheck,
    iconClass: "text-emerald-400",
  },
] as const;

/**
 * Seção de benefícios: pilares da solução.
 */
export function LandingFeatures(): React.ReactNode {
  return (
    <section className="border-y border-slate-800/50 bg-slate-900/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Vantagens Feitas para Proteger e Multiplicar
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400 text-lg">
            Criado para quem busca consistência no mercado sintético com inteligência, controle de
            risco estrito e execução sem interferência emocional.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              iconClass={feature.iconClass}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
