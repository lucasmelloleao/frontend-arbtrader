"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";

import { useTwoFactor } from "@/features/perfil/use-two-factor";

type TwoFactorFormProps = {
  /** Se o 2FA está ativo (vindo do RSC). */
  ativo: boolean;
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-sm tracking-widest text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

/**
 * Configuração de 2FA: gerar o secret (exibido para o app autenticador),
 * ativar com o código TOTP e desativar. UI fina — estado vive no
 * `useTwoFactor`; mutações são Server Actions.
 */
export function TwoFactorForm({ ativo }: TwoFactorFormProps): React.ReactNode {
  const { gerado, token, setToken, gerar, ativar, desativar, erro, mensagem, carregando } =
    useTwoFactor(ativo);

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
          ativo
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : "border-slate-700 bg-slate-800/50 text-slate-300"
        }`}
      >
        {ativo ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        ) : (
          <ShieldOff className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        )}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
              ativo ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"
            }`}
          >
            {ativo ? "Ativado" : "Desativado"}
          </span>
          <span>
            {ativo
              ? "Autenticação de dois fatores ativa. Para desativar, informe o código atual."
              : "Ative a autenticação de dois fatores para proteger sua conta."}
          </span>
        </div>
      </div>

      {gerado !== null ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="mb-2 text-sm font-medium text-emerald-300">
            Escaneie ou insira o secret no seu app autenticador:
          </p>
          <p className="mb-3 break-all rounded bg-emerald-950/50 p-3 font-mono text-sm text-emerald-100">
            {gerado.secret}
          </p>
          <a
            href={gerado.otpauthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-300 underline"
          >
            Abrir no app autenticador
          </a>
        </div>
      ) : null}

      {!ativo ? (
        <button
          type="button"
          onClick={gerar}
          disabled={carregando}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {carregando ? "Gerando..." : "Gerar chave 2FA"}
        </button>
      ) : null}

      <div>
        <label htmlFor="codigo-2fa" className={ROTULO_CLASS}>
          Código de 6 dígitos
        </label>
        <input
          id="codigo-2fa"
          type="text"
          inputMode="numeric"
          maxLength={6}
          className={CAMPO_CLASS}
          placeholder="000000"
          value={token}
          onChange={(evento) => setToken(evento.target.value)}
        />
      </div>

      {ativo ? (
        <button
          type="button"
          onClick={desativar}
          disabled={carregando}
          className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          {carregando ? "Desativando..." : "Desativar 2FA"}
        </button>
      ) : (
        <button
          type="button"
          onClick={ativar}
          disabled={carregando}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {carregando ? "Ativando..." : "Ativar 2FA"}
        </button>
      )}

      {erro === null ? null : (
        <p
          role="alert"
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erro}
        </p>
      )}
      {mensagem === null ? null : <output className="text-sm text-emerald-400">{mensagem}</output>}
    </div>
  );
}
