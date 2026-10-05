import { Suspense } from "react";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { perfilSchema } from "@/features/perfil/perfil.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Carrega o perfil do usuário (nome/email para o header do shell) e monta o
 * shell. Separado do layout porque ler o cookie (dentro do `kyServer`) torna a
 * subárvore dinâmica — fica sob `<Suspense>` (streaming), então as rotas do
 * dashboard continuam prerenderizáveis e o header do usuário chega assim que o
 * backend responde.
 */
async function PerfilCarregado({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactNode> {
  let perfil: { nome: string; email: string } | null = null;
  try {
    const dados = await apiClient(kyServer, API_ENDPOINTS.perfil.me, perfilSchema);
    perfil = { nome: dados.nome, email: dados.email };
  } catch {
    // Backend indisponível: o shell segue com o placeholder genérico.
  }

  return (
    <DashboardShell nome={perfil?.nome ?? null} email={perfil?.email ?? null}>
      {children}
    </DashboardShell>
  );
}

/**
 * Layout da área autenticada `/dashboard`. Server Component fino: compõe o
 * shell (client, interativo) com o conteúdo de cada rota via `children`. O
 * `proxy.ts` protege o prefixo `/dashboard/:path*`.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <Suspense fallback={<DashboardShell>{children}</DashboardShell>}>
      <PerfilCarregado>{children}</PerfilCarregado>
    </Suspense>
  );
}
