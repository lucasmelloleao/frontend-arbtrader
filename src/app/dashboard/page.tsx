import { Suspense } from "react";

import { AuditExchangePanel } from "@/features/perp-arb/components/audit-exchange-panel";
import { ConsultaProcessoTJPRPanel } from "@/features/portfolio/components/consulta-processo-tjpr-panel";
import { CorretorasTable } from "@/features/portfolio/components/corretoras-table";
import { EvolucaoGrafico } from "@/features/portfolio/components/evolucao-grafico";
import { MoedasSpotTable } from "@/features/portfolio/components/moedas-spot-table";
import { PosicoesFuturasTable } from "@/features/portfolio/components/posicoes-futuras-table";
import { ResumoCards } from "@/features/portfolio/components/resumo-cards";
import {
  portfolioHistoricoSchema,
  portfolioLiveSchema,
  portfolioResumoSchema,
} from "@/features/portfolio/portfolio.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/** Ano do copyright: constante para o prerender ficar estável (sem `new Date()`). */
const ANO_COPYRIGHT = 2026;

/**
 * Carrega o portfolio do backend e monta o overview.
 *
 * Separado da página porque ler o cookie (dentro do `kyServer`) torna a
 * subárvore dinâmica — com `cacheComponents`, o dado fica sob `<Suspense>`
 * (streaming, sempre fresco). Os três endpoints são buscados em paralelo
 * (`Promise.all`), sem waterfall.
 */
async function PortfolioCarregado(): Promise<React.ReactNode> {
  const [resumo, historico, live] = await Promise.all([
    apiClient(kyServer, API_ENDPOINTS.portfolio.resumo, portfolioResumoSchema),
    apiClient(kyServer, API_ENDPOINTS.portfolio.historico, portfolioHistoricoSchema),
    apiClient(kyServer, API_ENDPOINTS.portfolio.live, portfolioLiveSchema),
  ]);

  return (
    <div className="space-y-6">
      <ResumoCards resumo={resumo} />

      {/* Gráfico de evolução patrimonial */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-white">📈 Evolução Patrimonial</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <EvolucaoGrafico historico={historico} />
        </div>
      </div>

      {/* Moedas spot */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-white">🪙 Moedas Spot</h3>
        <MoedasSpotTable moedas={live.spotCoins} />
      </div>

      {/* Posições futuras */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-white">📊 Posições Futuras</h3>
        <PosicoesFuturasTable posicoes={live.positions} />
      </div>

      {/* Saldo das corretoras */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-white">🏦 Saldo das Corretoras Conectadas</h3>
        <CorretorasTable corretoras={resumo.exchanges} />
      </div>

      {/* Auditoria de trades por corretora */}
      <div>
        <AuditExchangePanel />
      </div>

      {/* Consulta Processual TJPR (Datajud) */}
      <div>
        <ConsultaProcessoTJPRPanel />
      </div>

      {/* Rodapé */}
      <footer className="border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
        <p>© {ANO_COPYRIGHT} Arbtrader. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

/**
 * Visão Geral da Arbitragem: resumo patrimonial, evolução, moedas spot,
 * posições futuras e saldo das corretoras. Leitura é RSC paralela; o dado
 * chega sempre fresco via `<Suspense>` (streaming).
 */
export default function DashboardPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Visão Geral da Arbitragem</h3>
        <p className="text-sm text-slate-400">Resumo patrimonial das corretoras conectadas.</p>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Carregando portfolio...</p>}>
        <PortfolioCarregado />
      </Suspense>
    </div>
  );
}
