"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { salvarTelegram } from "@/features/perfil/perfil.actions";
import {
  telegramFormSchema,
  type Perfil,
  type TelegramFormInput,
} from "@/features/perfil/perfil.schema";

type UseTelegramForm = {
  form: UseFormReturn<TelegramFormInput>;
  /** Handler pronto pro `onSubmit` do `<form>`. */
  enviar: (evento: React.FormEvent<HTMLFormElement>) => void;
  /** Mensagem de falha do servidor; `null` enquanto não houve erro. */
  erroServidor: string | null;
  salvo: boolean;
};

/**
 * Estado e submit do formulário de integração Telegram.
 *
 * O `chatId` vem pré-preenchido do perfil; o token NÃO (segurança: o backend só
 * devolve o mascarado, e reenviá-lo gravaria uma string inválida). O token
 * mascarado atual é exposto via placeholder para o usuário saber que já está
 * configurado. Token em branco ao salvar = não altera.
 *
 * @param perfil - Perfil atual, vindo do RSC.
 * @returns Form do RHF, handler de submit e estado da última tentativa.
 */
export function useTelegramForm(perfil: Perfil): UseTelegramForm {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const form = useForm<TelegramFormInput>({
    resolver: valibotResolver(telegramFormSchema),
    defaultValues: {
      telegramChatId: perfil.telegramChatId ?? "",
      telegramBotToken: "",
    },
  });

  const enviar = form.handleSubmit(async (valores) => {
    setErroServidor(null);
    setSalvo(false);
    const resultado = await salvarTelegram(valores);
    if (resultado.ok) {
      setSalvo(true);
      form.reset({ telegramChatId: valores.telegramChatId, telegramBotToken: "" });
      return;
    }
    setErroServidor(resultado.erro);
  });

  return { form, enviar, erroServidor, salvo };
}
