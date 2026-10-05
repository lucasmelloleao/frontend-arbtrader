"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { trocarSenha } from "@/features/perfil/perfil.actions";
import { trocarSenhaFormSchema, type TrocarSenhaFormInput } from "@/features/perfil/perfil.schema";

type UseTrocarSenhaForm = {
  form: UseFormReturn<TrocarSenhaFormInput>;
  enviar: (evento: React.FormEvent<HTMLFormElement>) => void;
  erroServidor: string | null;
  sucesso: boolean;
};

/**
 * Estado e submit do formulário de troca de senha.
 *
 * A mutação é a Server Action `trocarSenha` (revalida no servidor). Depois do
 * sucesso, o form é limpo.
 *
 * @returns Form do RHF, handler de submit, erro e flag de sucesso.
 */
export function useTrocarSenhaForm(): UseTrocarSenhaForm {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const form = useForm<TrocarSenhaFormInput>({
    resolver: valibotResolver(trocarSenhaFormSchema),
    defaultValues: { senhaAntiga: "", novaSenha: "", confirmacao: "" },
  });

  const enviar = form.handleSubmit(async (valores) => {
    setErroServidor(null);
    setSucesso(false);
    const resultado = await trocarSenha(valores);
    if (!resultado.ok) {
      setErroServidor(resultado.erro);
      return;
    }
    form.reset();
    setSucesso(true);
  });

  return { form, enviar, erroServidor, sucesso };
}
