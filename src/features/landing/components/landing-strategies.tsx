import { Activity, BrainCircuit, TrendingUp, Zap } from "lucide-react";

import { StrategyCard } from "@/features/landing/components/strategy-card";

/**
 * Cards de estratégia, na ordem do original: funding rates, flashloans EVM,
 * flash arbitragem Solana e scalping CEX.
 */
const STRATEGIES = [
  {
    title: "Arbitragem de Funding Rates",
    description:
      "Varre infinitas corretoras centralizadas (MEXC, OKX, Binance) em busca de discrepâncias nas taxas de financiamento. Executa hedge automatizado (Long/Short) garantindo ganhos constantes com risco direcional zero (Delta Neutro).",
    stats: ["Hedge Neutro Automático", "Scan CEX Multilateral", "Retorno Diário Recorrente"],
    icon: Activity,
    iconClass: "text-indigo-400",
    hoverBorder: "hover:border-indigo-500/50",
  },
  {
    title: "Liquidação EVM via Flashloans",
    description:
      "Monitora e liquida devedores subcolateralizados nas redes Arbitrum e Polygon (Aave/Compound). Utilizando Flash Loans sem necessidade de capital de risco próprio: paga a dívida, captura o prêmio e converte o colateral na DEX de forma atômica.",
    stats: [
      "Sem Capital Próprio de Entrada",
      "Transações Atômicas e Seguras",
      "Proteção Nativa Anti-MEV",
    ],
    icon: Zap,
    iconClass: "text-purple-400",
    hoverBorder: "hover:border-purple-500/50",
  },
  {
    title: "Arbitragem Flash Solana & Raydium",
    description:
      "Motor ultra veloz integrado ao ecossistema Solana. Monitora pools da Raydium, Meteora e Orca, executando rotas de arbitragem instantâneas para capitalizar variações de preço causadas por grandes fluxos de compra/venda.",
    stats: ["Velocidade Sub-segundo", "Liquidez Multichain", "Integração Jito MEV Bundle"],
    icon: BrainCircuit,
    iconClass: "text-cyan-400",
    hoverBorder: "hover:border-cyan-500/50",
  },
  {
    title: "CEX Scalping & OKX Engine",
    description:
      "Aproveita a volatilidade extrema de criptoativos de alto beta usando scalping quantitativo de alta frequência. Opera em milissegundos com ordens parciais, take profits curtos e gestão adaptativa de risco.",
    stats: ["HFT de Volatilidade", "Margem Dinâmica em USDT", "Slippage Protegido"],
    icon: TrendingUp,
    iconClass: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/50",
  },
] as const;

/**
 * Seção "Nossa Suíte de Estratégias de Elite": grade de cards das quatro
 * estratégias. Os ícones são passados como componente (server component não
 * serializa, mas aqui a página é toda estática de marketing — sem dado).
 */
export function LandingStrategies(): React.ReactNode {
  return (
    <section id="strategies" className="bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Nossa Suíte de Estratégias de Elite
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Motores algorítmicos independentes criados para extrair o máximo valor em diferentes
            ecossistemas da Web3 e Finanças Centralizadas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {STRATEGIES.map((strategy) => (
            <StrategyCard
              key={strategy.title}
              title={strategy.title}
              description={strategy.description}
              stats={strategy.stats}
              icon={strategy.icon}
              iconClass={strategy.iconClass}
              hoverBorder={strategy.hoverBorder}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
