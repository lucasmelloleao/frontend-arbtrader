import { Suspense } from "react";

import { KeyRound, Lock, User } from "lucide-react";

import { PerfilDadosForm } from "@/features/perfil/components/perfil-dados-form";
import { TelegramForm } from "@/features/perfil/components/telegram-form";
import { TrocarSenhaForm } from "@/features/perfil/components/trocar-senha-form";
import { TwoFactorForm } from "@/features/perfil/components/two-factor-form";
import { perfilSchema } from "@/features/perfil/perfil.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Carrega o perfil do usuário e monta a tela de manutenção do cadastro.
 *
 * Separado da página porque ler o cookie (dentro do `kyServer`) torna a
 * subárvore dinâmica — com `cacheComponents`, o dado fica sob `<Suspense>`
 * (streaming, sempre fresco).
 */
async function PerfilCarregado(): Promise<React.ReactNode> {
  const perfil = await apiClient(kyServer, API_ENDPOINTS.perfil.me, perfilSchema);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
          <User className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          Dados do Usuário
        </h4>
        <PerfilDadosForm perfil={perfil} />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
          <Lock className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          Trocar Senha
        </h4>
        <TrocarSenhaForm />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm lg:col-span-2">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
          <KeyRound className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          Autenticação de Dois Fatores (2FA)
        </h4>
        <TwoFactorForm ativo={perfil.twoFactorEnabled} />
      </section>

      <section className="lg:col-span-2">
        <TelegramForm perfil={perfil} />
      </section>
    </div>
  );
}

/**
 * Perfil / manutenção do cadastro: dados do usuário, troca de senha e 2FA.
 * Leitura é RSC; mutações são Server Actions com `revalidatePath`.
 */
export default function ProfilePage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Perfil</h3>
        <p className="text-sm text-slate-400">Mantenha seus dados, senha e segurança em dia.</p>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Carregando perfil...</p>}>
        <PerfilCarregado />
      </Suspense>
    </div>
  );
}
