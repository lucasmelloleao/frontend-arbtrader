import { Suspense } from "react";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { perfilSchema } from "@/features/perfil/perfil.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Layout da área autenticada `/dashboard`. Server Component fino: busca o
 * perfil do usuário (nome/email para o header do shell) e compõe o shell
 * (client, interativo) com o conteúdo de cada rota via `children`. O
 * `proxy.ts` protege o prefixo `/dashboard/:path*`.
 */
async function DashboardLayout({
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
    <Suspense fallback={<DashboardShell />}>
      <DashboardShell nome={perfil?.nome ?? null} email={perfil?.email ?? null}>
        {children}
      </DashboardShell>
    </Suspense>
  );
}

export default DashboardLayout;
