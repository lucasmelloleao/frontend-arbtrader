import { Suspense } from "react";
import { cookies } from "next/headers";
import { LatencyArbDashboard } from "@/features/latency-arb/components/latency-arb-dashboard";
import { buscarLatencySettings, buscarLatencyTrades } from "@/features/latency-arb/latency-arb.actions";

async function LatencyArbCarregado(): Promise<React.ReactNode> {
  await cookies();
  const [settings, trades] = await Promise.all([
    buscarLatencySettings(),
    buscarLatencyTrades(),
  ]);

  return <LatencyArbDashboard settings={settings} trades={trades} />;
}

export default function LatencyArbPage(): React.ReactNode {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm font-bold text-slate-400">
          Carregando Dashboard de Latência (cTrader → MEXC)...
        </div>
      }
    >
      <LatencyArbCarregado />
    </Suspense>
  );
}
