"use client";

import { useRouter } from "next/navigation";

import { LogOut } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyClient } from "@/lib/api/ky.client";

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível sair. Tente novamente.";

type LogoutButtonProps = {
  /** Classes adicionais para o botão (estilo do container onde é usado). */
  className?: string;
};

/**
 * Botão de sair do dashboard.
 *
 * Logout é browser-direct (`kyClient`) pela mesma razão do login: o backend
 * precisa limpar o cookie HttpOnly, e o `Set-Cookie` só pousa no browser se a
 * requisição partir dele. Depois do sucesso, `router.replace` volta pro login
 * e `router.refresh()` repuxa a árvore de servidor (o `proxy.ts` volta a
 * redirecionar).
 */
export function LogoutButton({ className = "" }: LogoutButtonProps): React.ReactNode {
  const router = useRouter();

  const sair = async (): Promise<void> => {
    try {
      // Sem schema: o contrato de logout não devolve `data`.
      await apiClient(kyClient, API_ENDPOINTS.auth.logout, undefined, {
        method: "post",
      });
    } catch (error: unknown) {
      // Falha de rede/backend não deve prender o usuário no dashboard: mesmo
      // sem confirmação do servidor, seguir pro login é o comportamento seguro
      // (o cookie pode ter expirado; o proxy redireciona de qualquer forma).
      console.error(error instanceof Error ? error.message : ERRO_INESPERADO);
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={sair}
      className={`inline-flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white ${className}`}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      Sair
    </button>
  );
}
