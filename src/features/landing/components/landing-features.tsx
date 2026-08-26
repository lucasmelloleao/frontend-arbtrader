import { BarChart3, BrainCircuit, Shield } from "lucide-react";

import { FeatureCard } from "@/features/landing/components/feature-card";

/**
 * Benefícios (a tecnologia por trás dos lucros): segurança, telemetria e
 * capital. Ícones como componente, mesma mecânica da seção de estratégias.
 */
const FEATURES = [
  {
    title: "Segurança Militar",
    description:
      "Chaves privadas criptografadas com AES-256 e descriptografadas em memória apenas no boot. Seus fundos e acessos permanecem inacessíveis ao mundo exterior.",
    icon: Shield,
    iconClass: "text-indigo-400",
  },
  {
    title: "Telemetria Unificada",
    description:
      "Logs em tempo real e monitoramento centralizado direto no Telegram. Você sabe exatamente quando um lucro é gerado e o status de saúde de cada robô.",
    icon: BrainCircuit,
    iconClass: "text-fuchsia-400",
  },
  {
    title: "Zero Capital Trancado",
    description:
      "Com a estratégia de Flashloans, operamos com milhões de dólares emprestados de protocolos de liquidez na mesma transação. Sem travar seu patrimônio.",
    icon: BarChart3,
    iconClass: "text-emerald-400",
  },
] as const;

/**
 * Seção de benefícios: três pilares do produto apresentados em cards.
 */
export function LandingFeatures(): React.ReactNode {
  return (
    <section className="border-y border-slate-800/50 bg-slate-900/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">A Tecnologia por Trás dos Lucros</h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Combinamos infraestrutura robusta, análise de dados inteligente e contratos inteligentes
            próprios para criar o ecossistema ideal para traders institucionais e de varejo.
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
