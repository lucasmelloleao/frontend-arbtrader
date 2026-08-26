"use client";

import { useTrocarSenhaForm } from "@/features/perfil/use-trocar-senha-form";

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

/**
 * Formulário de troca de senha: senha atual, nova senha e confirmação. UI
 * fina — estado, submit e erro vivem no `useTrocarSenhaForm`.
 */
export function TrocarSenhaForm(): React.ReactNode {
  const { form, enviar, erroServidor, sucesso } = useTrocarSenhaForm();
  const { register, formState } = form;

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div>
        <label htmlFor="senha-antiga" className={ROTULO_CLASS}>
          Senha Atual
        </label>
        <input
          id="senha-antiga"
          type="password"
          autoComplete="current-password"
          className={CAMPO_CLASS}
          aria-invalid={formState.errors.senhaAntiga !== undefined}
          {...register("senhaAntiga")}
        />
        {formState.errors.senhaAntiga ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.senhaAntiga.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="nova-senha" className={ROTULO_CLASS}>
          Nova Senha
        </label>
        <input
          id="nova-senha"
          type="password"
          autoComplete="new-password"
          className={CAMPO_CLASS}
          aria-invalid={formState.errors.novaSenha !== undefined}
          {...register("novaSenha")}
        />
        {formState.errors.novaSenha ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.novaSenha.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirmar-senha" className={ROTULO_CLASS}>
          Confirmar Nova Senha
        </label>
        <input
          id="confirmar-senha"
          type="password"
          autoComplete="new-password"
          className={CAMPO_CLASS}
          aria-invalid={formState.errors.confirmacao !== undefined}
          {...register("confirmacao")}
        />
        {formState.errors.confirmacao ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.confirmacao.message}
          </p>
        ) : null}
      </div>

      {erroServidor === null ? null : (
        <p
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erroServidor}
        </p>
      )}
      {sucesso ? (
        <output className="text-sm text-emerald-400">Senha alterada com sucesso.</output>
      ) : null}

      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {formState.isSubmitting ? "Alterando..." : "Alterar Senha"}
      </button>
    </form>
  );
}
