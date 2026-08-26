"use client";

import { usePerfilForm } from "@/features/perfil/use-perfil-form";
import type { Perfil } from "@/features/perfil/perfil.schema";

type PerfilFormProps = {
  perfil: Perfil;
};

const CAMPO_CLASS =
  "w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

/**
 * Formulário de perfil: UI fina. Todo estado, submit e tratamento de erro vivem
 * no `usePerfilForm`; aqui só há composição e render.
 *
 * Acessibilidade é parte do done: cada input tem `label` associado, o erro é
 * anunciado por `role="alert"`, e o botão reflete o estado de envio.
 */
export function PerfilForm({ perfil }: PerfilFormProps): React.ReactNode {
  const { form, enviar, erroServidor, salvo } = usePerfilForm(perfil);
  const { register, formState } = form;

  return (
    <form onSubmit={enviar} className="flex w-full max-w-md flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="perfil-nome" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="perfil-nome"
          className={CAMPO_CLASS}
          aria-invalid={formState.errors.nome !== undefined}
          {...register("nome")}
        />
        {formState.errors.nome ? (
          <p role="alert" className="text-sm text-red-600">
            {formState.errors.nome.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="perfil-email" className="text-sm font-medium">
          E-mail
        </label>
        <input
          id="perfil-email"
          type="email"
          className={CAMPO_CLASS}
          aria-invalid={formState.errors.email !== undefined}
          {...register("email")}
        />
        {formState.errors.email ? (
          <p role="alert" className="text-sm text-red-600">
            {formState.errors.email.message}
          </p>
        ) : null}
      </div>

      {erroServidor === null ? null : (
        <p role="alert" className="text-sm text-red-600">
          {erroServidor}
        </p>
      )}
      {salvo ? <output className="text-sm text-green-700">Perfil salvo.</output> : null}

      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {formState.isSubmitting ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
