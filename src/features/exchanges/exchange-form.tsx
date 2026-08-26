"use client";

import { Pencil, Plus } from "lucide-react";

import { useExchangeForm } from "@/features/exchanges/use-exchange-form";
import type { Exchange } from "@/features/exchanges/exchanges.schema";
import { SUPPORTED_CEX } from "@/shared/constants/supported-cex";

type ExchangeFormProps = {
  /** Conexão em edição (null = modo criar). */
  editando: Exchange | null;
  /** Disparado após salvar com sucesso (para o manager fechar o form). */
  aoSalvo?: () => void;
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

/**
 * Formulário de chave CEX (criar ou editar): UI fina. Estado, submit e erro
 * vivem no `useExchangeForm`; a mutação é a Server Action correspondente.
 */
export function ExchangeForm({ editando, aoSalvo }: ExchangeFormProps): React.ReactNode {
  const { form, enviar, erroServidor, cancelarEdicao } = useExchangeForm(editando, { aoSalvo });
  const { register, formState } = form;
  const emEdicao = editando !== null;

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="exchange-id" className={ROTULO_CLASS}>
            Corretora (Exchange)
          </label>
          <select
            id="exchange-id"
            className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-white outline-none transition-all focus:border-indigo-500"
            {...register("exchangeId")}
          >
            {SUPPORTED_CEX.map((cex) => (
              <option key={cex.id} value={cex.id}>
                {cex.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="exchange-nome" className={ROTULO_CLASS}>
            Nome da Conexão
          </label>
          <input
            id="exchange-nome"
            className={`${CAMPO_CLASS} font-sans`}
            placeholder="Ex: Minha Conta MEXC"
            aria-invalid={formState.errors.nome !== undefined}
            {...register("nome")}
          />
          {formState.errors.nome ? (
            <p role="alert" className="mt-1 text-sm text-red-500">
              {formState.errors.nome.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="exchange-apikey" className={ROTULO_CLASS}>
          API Key
        </label>
        <input
          id="exchange-apikey"
          type="text"
          className={CAMPO_CLASS}
          placeholder="Cole sua API Key aqui"
          aria-invalid={formState.errors.apiKey !== undefined}
          {...register("apiKey")}
        />
        {formState.errors.apiKey ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.apiKey.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="exchange-apisecret" className={ROTULO_CLASS}>
          API Secret{" "}
          {emEdicao ? (
            <span className="text-xs text-orange-400">(vazio = manter o atual)</span>
          ) : null}
        </label>
        <input
          id="exchange-apisecret"
          type="password"
          className={CAMPO_CLASS}
          placeholder={emEdicao ? "Deixe em branco para manter" : "Cole seu API Secret aqui"}
          aria-invalid={formState.errors.apiSecret !== undefined}
          {...register("apiSecret")}
        />
        {formState.errors.apiSecret ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.apiSecret.message}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">
          {emEdicao
            ? "O segredo atual é mantido quando o campo fica vazio."
            : "Será criptografado (AES-256-GCM) antes de salvar no servidor."}
        </p>
      </div>

      {erroServidor === null ? null : (
        <p
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erroServidor}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {emEdicao ? (
            <Pencil className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Plus className="h-5 w-5" aria-hidden="true" />
          )}
          {formState.isSubmitting
            ? "Salvando..."
            : emEdicao
              ? "Salvar Alterações"
              : "Registrar Chaves da API"}
        </button>
        {emEdicao ? (
          <button
            type="button"
            onClick={cancelarEdicao}
            className="rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
