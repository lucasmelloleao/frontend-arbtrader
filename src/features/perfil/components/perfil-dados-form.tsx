"use client";

import { usePerfilForm } from "@/features/perfil/use-perfil-form";
import type { Perfil } from "@/features/perfil/perfil.schema";

type PerfilDadosFormProps = {
  perfil: Perfil;
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

/**
 * Formulário de dados do usuário (nome, e-mail, telefone). UI fina — estado,
 * submit e erro vivem no `usePerfilForm`; a mutação é a Server Action
 * `salvarPerfil`.
 */
export function PerfilDadosForm({ perfil }: PerfilDadosFormProps): React.ReactNode {
  const { form, enviar, erroServidor, salvo } = usePerfilForm(perfil);
  const { register, formState } = form;

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div>
        <label htmlFor="perfil-nome" className={ROTULO_CLASS}>
          Nome
        </label>
        <input
          id="perfil-nome"
          className={CAMPO_CLASS}
          aria-invalid={formState.errors.nome !== undefined}
          {...register("nome")}
        />
        {formState.errors.nome ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.nome.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="perfil-email" className={ROTULO_CLASS}>
          E-mail
        </label>
        <input
          id="perfil-email"
          type="email"
          readOnly
          className={`${CAMPO_CLASS} cursor-not-allowed opacity-60`}
          {...register("email")}
        />
        <p className="mt-1 text-xs text-slate-500">
          O e-mail não pode ser alterado. Contate o suporte se precisar.
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
      {salvo ? <output className="text-sm text-emerald-400">Perfil salvo.</output> : null}

      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
      </button>
    </form>
  );
}
