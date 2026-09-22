"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { loginSchema, type LoginInput } from "@/features/auth/login.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyClient } from "@/lib/api/ky.client";

type UseLoginForm = {
  form: UseFormReturn<LoginInput>;
  entrar: (evento: React.FormEvent<HTMLFormElement>) => void;
  erroServidor: string | null;
  requer2fa: boolean;
  voltarAoLogin: () => void;
};

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível entrar. Tente novamente.";

/** Mensagem de negócio que o backend usa para sinalizar 2FA obrigatório. */
const ERRO_2FA_REQUIRED = "2fa_required";

/**
 * Estado e submit do login.
 *
 * Esta é a ÚNICA família de chamada que sai do browser direto pro backend
 * (`kyClient`), e o motivo é o cookie: o `Set-Cookie` HttpOnly da resposta só
 * pousa se a requisição partir do browser. Login feito por Server Action
 * perderia o cookie no caminho. Leitura de dado, ao contrário, é sempre RSC.
 *
 * Fluxo 2FA: quando o backend responde com o erro de negócio "2fa_required"
 * (usuário tem 2FA habilitado), o form entra no modo de código — o próximo
 * submit envia `codigo2fa` junto. Isso espelha o comportamento do painel
 * legado, agora sobre o contrato REST do backend.
 *
 * Depois do sucesso, `router.refresh()` repuxa a árvore de servidor já com o
 * cookie: é o que faz o `proxy.ts` parar de redirecionar pro login.
 *
 * @param destino - Rota tipada para onde ir depois de entrar (typedRoutes).
 * @returns Form do RHF, handler de submit, erro da última tentativa, se pede
 * 2FA e o callback de voltar ao login.
 */
export function useLoginForm(destino: Route): UseLoginForm {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [requer2fa, setRequer2fa] = useState(false);

  const form = useForm<LoginInput>({
    resolver: valibotResolver(loginSchema),
    defaultValues: { email: "", senha: "", codigo2fa: "" },
  });

  const entrar = form.handleSubmit(async (credenciais) => {
    setErroServidor(null);
    try {
      // Sem schema: a identidade vem do cookie (Set-Cookie HttpOnly do backend).
      await apiClient(kyClient, API_ENDPOINTS.auth.login, undefined, {
        method: "post",
        json: {
          email: credenciais.email,
          password: credenciais.senha,
          twoFactorToken: credenciais.codigo2fa || undefined,
        },
      });
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : ERRO_INESPERADO;
      if (mensagem === ERRO_2FA_REQUIRED) {
        setRequer2fa(true);
        setErroServidor("Informe o código de autenticação de dois fatores (2FA).");
        return;
      }
      setErroServidor(mensagem);
      return;
    }
    router.replace(destino);
    router.refresh();
  });

  const voltarAoLogin = (): void => {
    setRequer2fa(false);
    setErroServidor(null);
    form.setValue("codigo2fa", "");
  };

  return { form, entrar, erroServidor, requer2fa, voltarAoLogin };
}
