import { BrainCircuit, Compass, Gauge, ShieldCheck } from "lucide-react";

import { StrategyCard } from "@/features/landing/components/strategy-card";

/**
 * Recursos e pilares de assertividade do Robô Deriv.
 */
const DERIV_FEATURES = [
  {
    title: "Roteamento Inteligente de Ativos",
    description:
      "O robô monitora continuamente múltiplos índices sintéticos da Deriv (10, 25, 50, 75 e 100) e migra as operações automaticamente para o mercado com a movimentação mais limpa e direcional do momento, fugindo de gráficos travados ou erráticos.",
    stats: ["Varredura Multiativo 24/7", "Foco no Ativo Mais Limpo", "Detecção de Tendência Pura"],
    icon: Compass,
    iconClass: "text-cyan-400",
    hoverBorder: "hover:border-cyan-500/50",
  },
  {
    title: "IA Guardiã com Meta-Labeling",
    description:
      "Uma camada avançada de Inteligência Artificial audita cada oportunidade gerada. Ela reconhece padrões ocultos e armadilhas de reversão da corretora, vetando qualquer ordem duvidosa e autorizando apenas entradas de altíssima probabilidade de vitória.",
    stats: [
      "Filtro Preditivo Anti-Armadilha",
      "Decisão Baseada em Padrões",
      "Auditoria Instantânea de Sinal",
    ],
    icon: BrainCircuit,
    iconClass: "text-purple-400",
    hoverBorder: "hover:border-purple-500/50",
  },
  {
    title: "Barreira Milimétrica Autoajustável",
    description:
      "Nada de distâncias fixas ou chutes. A barreira de preço é calculada dinamicamente com base na volatilidade real de cada segundo. Isso garante que o alvo esteja sempre em uma zona estatisticamente favorável para fechar no lucro.",
    stats: [
      "Ajuste por Volatilidade Real",
      "Margem de Segurança Ampliada",
      "Vantagem Matemática em Cada Ponto",
    ],
    icon: Gauge,
    iconClass: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/50",
  },
  {
    title: "Blindagem de Banca e Pausa Preventiva",
    description:
      "Proteção inteligente de capital: o robô detecta quando o mercado entra em ruído caótico ou perde o ritmo e ativa quarentenas preventivas automáticas, preservando seus ganhos e seu saldo até o retorno da estabilidade.",
    stats: ["Preservação de Lucros", "Proteção Contra Dias Ruins", "Gestão Sem Martingale Cego"],
    icon: ShieldCheck,
    iconClass: "text-teal-400",
    hoverBorder: "hover:border-teal-500/50",
  },
] as const;

/**
 * Seção de Recursos de Alta Assertividade do Robô Deriv.
 */
export function LandingStrategies(): React.ReactNode {
  return (
    <section id="recursos-deriv" className="bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <div className="mb-3 inline-block rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
            Tecnologia de Alta Performance
          </div>
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-5xl">
            Por que o Robô Deriv é tão Assertivo?
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400 text-lg">
            Esqueça estratégias manuais e emocionais. Entenda como nossa engenharia quantitativa
            combina filtros inteligentes para operar com consistência comprovada.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {DERIV_FEATURES.map((feat) => (
            <StrategyCard
              key={feat.title}
              title={feat.title}
              description={feat.description}
              stats={feat.stats}
              icon={feat.icon}
              iconClass={feat.iconClass}
              hoverBorder={feat.hoverBorder}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
