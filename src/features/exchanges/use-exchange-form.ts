"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { atualizarExchange, salvarExchange } from "@/features/exchanges/exchanges.actions";
import {
  criarExchangeSchema,
  editarExchangeSchema,
  type CriarExchangeInput,
  type EditarExchangeInput,
  type Exchange,
} from "@/features/exchanges/exchanges.schema";
import { SUPPORTED_CEX } from "@/shared/constants/supported-cex";

/** Shape comum do form: os schemas de criar/editar têm os mesmos campos. */
type ExchangeFormInput = CriarExchangeInput & EditarExchangeInput;

type UseExchangeForm = {
  form: UseFormReturn<ExchangeFormInput>;
  enviar: (evento: React.FormEvent<HTMLFormElement>) => void;
  erroServidor: string | null;
  /** Conexão em edição (null = modo criar). */
  editando: Exchange | null;
  cancelarEdicao: () => void;
};

type UseExchangeFormOptions = {
  /** Disparado após salvar com sucesso (para o manager fechar o form). */
  aoSalvo?: () => void;
};

const VALORES_INICIAIS: ExchangeFormInput = {
  exchangeId: SUPPORTED_CEX[0].id,
  nome: "",
  apiKey: "",
  apiSecret: "",
};

/**
 * Estado e submit do formulário de chave CEX (criar ou editar).
 *
 * Em modo edição, o form é pré-preenchido com a conexão e o `apiSecret` fica
 * vazio (o backend nunca devolve o segredo; vazio = manter). A mutação é a
 * Server Action (`salvarExchange`/`atualizarExchange`) que revalida no
 * servidor e chama `revalidatePath`.
 *
 * @param editando - Conexão em edição (null = criar nova).
 * @returns Form do RHF, handler de submit, erro e controle de edição.
 */
export function useExchangeForm(
  editando: Exchange | null,
  { aoSalvo }: UseExchangeFormOptions = {},
): UseExchangeForm {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const form = useForm<ExchangeFormInput>({
    resolver: valibotResolver(editando === null ? criarExchangeSchema : editarExchangeSchema),
    defaultValues:
      editando === null
        ? VALORES_INICIAIS
        : {
            exchangeId: editando.exchangeId,
            nome: editando.nome,
            apiKey: editando.apiKey,
            apiSecret: "",
          },
  });

  const enviar = form.handleSubmit(async (valores) => {
    setErroServidor(null);
    const resultado =
      editando === null
        ? await salvarExchange(valores)
        : await atualizarExchange(editando.id, valores);
    if (!resultado.ok) {
      setErroServidor(resultado.erro);
      return;
    }
    form.reset(VALORES_INICIAIS);
    router.refresh();
    aoSalvo?.();
  });

  const cancelarEdicao = (): void => {
    form.reset(VALORES_INICIAIS);
    router.refresh();
  };

  return { form, enviar, erroServidor, editando, cancelarEdicao };
}
