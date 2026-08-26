import { LandingCta } from "@/features/landing/components/landing-cta";
import { LandingFeatures } from "@/features/landing/components/landing-features";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { LandingStats } from "@/features/landing/components/landing-stats";
import { LandingStrategies } from "@/features/landing/components/landing-strategies";

/**
 * Página inicial: landing de marketing do produto (ArbTrade).
 *
 * Server Component puro: só compõe as seções. A única folha interativa é o
 * `HelpButton` dentro do header (modal de como operar).
 */
export default function Home(): React.ReactNode {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingStrategies />
        <LandingFeatures />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
