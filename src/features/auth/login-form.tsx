"use client";

import type { Route } from "next";

import { Lock, Mail, ShieldCheck } from "lucide-react";

import { useLoginForm } from "@/features/auth/use-login-form";

type LoginFormProps = {
  /** Rota tipada para onde ir depois de entrar (typedRoutes valida no build). */
  destino: Route;
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm font-medium text-slate-400";

/**
 * Formulário de login: UI fina no visual do painel legado (dark, ícones nos
 * campos). Estado, chamada e erro vivem no `useLoginForm`; aqui só há
 * composição e render.
 */
export function LoginForm({ destino }: LoginFormProps): React.ReactNode {
  const { form, entrar, erroServidor, requer2fa, voltarAoLogin } = useLoginForm(destino);
  const { register, formState } = form;

  return (
    <form onSubmit={entrar} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className={ROTULO_CLASS}>
          E-mail
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className={CAMPO_CLASS}
            placeholder="you@example.com"
            aria-invalid={formState.errors.email !== undefined}
            {...register("email")}
          />
        </div>
        {formState.errors.email ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="login-senha" className={ROTULO_CLASS}>
          Senha
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            className={CAMPO_CLASS}
            placeholder="••••••••"
            aria-invalid={formState.errors.senha !== undefined}
            {...register("senha")}
          />
        </div>
        {formState.errors.senha ? (
          <p role="alert" className="mt-1 text-sm text-red-500">
            {formState.errors.senha.message}
          </p>
        ) : null}
      </div>

      {requer2fa ? (
        <div>
          <label htmlFor="login-2fa" className={ROTULO_CLASS}>
            Código 2FA
          </label>
          <div className="relative">
            <ShieldCheck
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-500"
              aria-hidden="true"
            />
            <input
              id="login-2fa"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={`${CAMPO_CLASS} font-mono text-lg tracking-widest`}
              placeholder="000000"
              aria-invalid={formState.errors.codigo2fa !== undefined}
              {...register("codigo2fa")}
            />
          </div>
          {formState.errors.codigo2fa ? (
            <p role="alert" className="mt-1 text-sm text-red-500">
              {formState.errors.codigo2fa.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={voltarAoLogin}
            className="mt-2 text-xs text-slate-400 transition-colors hover:text-white"
          >
            Voltar ao login
          </button>
        </div>
      ) : null}

      {erroServidor === null ? null : (
        <p
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erroServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {formState.isSubmitting ? "Entrando..." : requer2fa ? "Verificar código 2FA" : "Entrar"}
      </button>
    </form>
  );
}
