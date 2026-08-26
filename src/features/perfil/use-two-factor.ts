"use client";

import { useState } from "react";

import { ativar2fa, desativar2fa, gerar2fa } from "@/features/perfil/perfil.actions";
import type { Gerar2fa } from "@/features/perfil/perfil.schema";

type UseTwoFactor = {
  /** Se o 2FA está ativo (estado local, reflete ativação/desativação na hora). */
  ativo: boolean;
  /** Dados do secret gerado (para exibir o QR). */
  gerado: Gerar2fa | null;
  /** Estado do código digitado. */
  token: string;
  setToken: (valor: string) => void;
  gerar: () => Promise<void>;
  ativar: () => Promise<void>;
  desativar: () => Promise<void>;
  erro: string | null;
  mensagem: string | null;
  carregando: boolean;
};

/**
 * Estado das ações de 2FA: gerar secret, ativar e desativar.
 *
 * `ativo` é estado local inicializado da prop do RSC: ao ativar/desativar, a UI
 * reflete na hora (o `revalidatePath` da Server Action mantém o RSC em dia na
 * próxima visita). A geração devolve `secret` + `otpauthUrl` (para o QR); a
 * ativação valida o código TOTP digitado; a desativação exige o código atual.
 *
 * @param ativoInicial - Se o 2FA está ativo (vindo do RSC).
 * @returns Estado e ações do 2FA.
 */
export function useTwoFactor(ativoInicial: boolean): UseTwoFactor {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [gerado, setGerado] = useState<Gerar2fa | null>(null);
  const [token, setToken] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const gerar = async (): Promise<void> => {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const resultado = await gerar2fa();
    setCarregando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setGerado(resultado.dados);
  };

  const ativar = async (): Promise<void> => {
    if (token.length < 6) {
      setErro("Informe o código de 6 dígitos.");
      return;
    }
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const resultado = await ativar2fa({ token });
    setCarregando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setAtivo(true);
    setMensagem("2FA ativado com sucesso.");
    setGerado(null);
    setToken("");
  };

  const desativar = async (): Promise<void> => {
    if (token.length < 6) {
      setErro("Informe o código de 6 dígitos.");
      return;
    }
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const resultado = await desativar2fa({ token });
    setCarregando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setAtivo(false);
    setMensagem("2FA desativado.");
    setToken("");
  };

  return {
    ativo,
    gerado,
    token,
    setToken,
    gerar,
    ativar,
    desativar,
    erro,
    mensagem,
    carregando,
  };
}
