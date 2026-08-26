import { Suspense } from "react";

import { LinkIcon } from "lucide-react";

import { ExchangesManager } from "@/features/exchanges/exchanges-manager";
import { exchangeListSchema } from "@/features/exchanges/exchanges.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Carrega as conexões CEX do backend e monta a tela.
 *
 * Separado da página porque ler o cookie (dentro do `kyServer`) torna a
 * subárvore dinâmica — com `cacheComponents`, o dado fica sob `<Suspense>`
 * (streaming, sempre fresco).
 */
async function ExchangesCarregados(): Promise<React.ReactNode> {
  const exchanges = await apiClient(kyServer, API_ENDPOINTS.exchanges.listar, exchangeListSchema);

  return <ExchangesManager exchanges={exchanges} />;
}

/**
 * Integrações de Exchange (CEX). Leitura é RSC; mutação é Server Action
 * (`salvarExchange`/`atualizarExchange`/`deletarExchange`) com `revalidatePath`.
 */
export default function ExchangesPage(): React.ReactNode {
  return (
    <div>
      <div className="mb-8 flex items-start gap-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 shadow-sm">
        <LinkIcon className="mt-0.5 h-6 w-6 shrink-0 text-sky-400" aria-hidden="true" />
        <div>
          <h4 className="mb-1 font-bold text-sky-400">Gerenciamento de API</h4>
          <p className="text-sm text-sky-200/80">
            Registre as chaves de API das suas corretoras centralizadas. Os segredos são
            criptografados antes de salvar.
          </p>
        </div>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Carregando conexões...</p>}>
        <ExchangesCarregados />
      </Suspense>
    </div>
  );
}
