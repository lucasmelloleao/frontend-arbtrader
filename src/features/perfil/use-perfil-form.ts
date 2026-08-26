"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { salvarPerfil } from "@/features/perfil/perfil.actions";
import {
  perfilFormSchema,
  type Perfil,
  type PerfilFormInput,
} from "@/features/perfil/perfil.schema";

type UsePerfilForm = {
  form: UseFormReturn<PerfilFormInput>;
  /** Handler pronto pro `onSubmit` do `<form>`. */
  enviar: (evento: React.FormEvent<HTMLFormElement>) => void;
  /** Mensagem de falha do servidor; `null` enquanto não houve erro. */
  erroServidor: string | null;
  salvo: boolean;
};

/**
 * Estado e submit do formulário de perfil.
 *
 * O hook isola estado e efeito; o componente só compõe e renderiza (SRP). A
 * validação de client usa o MESMO schema que a Server Action revalida no
 * servidor — um contrato, dois pontos de checagem.
 *
 * @param perfil - Perfil atual, vindo do RSC, usado como valor inicial.
 * @returns Form do RHF, handler de submit e o estado da última tentativa.
 */
export function usePerfilForm(perfil: Perfil): UsePerfilForm {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const form = useForm<PerfilFormInput>({
    resolver: valibotResolver(perfilFormSchema),
    defaultValues: { nome: perfil.nome, email: perfil.email },
  });

  const enviar = form.handleSubmit(async (valores) => {
    setErroServidor(null);
    setSalvo(false);

    // O e-mail é imutável: o backend é a fonte da verdade. Sempre envia o
    // e-mail atual do perfil, nunca o valor do form (readOnly na UI).
    const resultado = await salvarPerfil({ ...valores, email: perfil.email });
    if (resultado.ok) {
      setSalvo(true);
      return;
    }
    setErroServidor(resultado.erro);
  });

  return { form, enviar, erroServidor, salvo };
}
