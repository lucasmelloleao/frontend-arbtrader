"use client";

import { Pencil, Plus } from "lucide-react";

import { useExchangeForm } from "@/features/exchanges/use-exchange-form";
import type { Exchange } from "@/features/exchanges/exchanges.schema";
import { isCtraderId, isFixId, SUPPORTED_CEX } from "@/shared/constants/supported-cex";

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
 *
 * Campos condicionais ao tipo de corretora:
 * - cTrader/Pepperstone (`ctrader`/`pepperstone`): Client ID, Client Secret,
 *   Access Token, Refresh Token, Account ID, Username e Ambiente (Open API).
 * - FIX API (`fix`/`pepperstone-fix`/`ctrader-fix`): Host, portas, comp IDs,
 *   usuário e senha.
 * - CEX padrão: API Key/Secret.
 */
export function ExchangeForm({ editando, aoSalvo }: ExchangeFormProps): React.ReactNode {
  const { form, enviar, erroServidor, cancelarEdicao } = useExchangeForm(editando, { aoSalvo });
  const { register, formState, watch } = form;
  const emEdicao = editando !== null;
  const exchangeId = watch("exchangeId");
  const ehCtrader = isCtraderId(exchangeId);
  const ehFix = isFixId(exchangeId);

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

      {ehCtrader ? (
        <>
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-sky-200/80">
            Credenciais da cTrader Open API (Spotware). Acesse{" "}
            <span className="font-mono text-sky-300">connect.spotware.com</span> → Applications →
            Credentials e preencha o Client ID/Secret da sua aplicação. O Account ID é opcional — o
            backend detecta pelo token quando disponível.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exchange-clientid" className={ROTULO_CLASS}>
                Client ID (App ID)
              </label>
              <input
                id="exchange-clientid"
                type="text"
                className={CAMPO_CLASS}
                placeholder="Ex: 36791_MyAppId"
                aria-invalid={formState.errors.clientId !== undefined}
                {...register("clientId")}
              />
              {formState.errors.clientId ? (
                <p role="alert" className="mt-1 text-sm text-red-500">
                  {formState.errors.clientId.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="exchange-clientsecret" className={ROTULO_CLASS}>
                Client Secret{" "}
                {emEdicao ? (
                  <span className="text-xs text-orange-400">(vazio = manter o atual)</span>
                ) : null}
              </label>
              <input
                id="exchange-clientsecret"
                type="password"
                className={CAMPO_CLASS}
                placeholder={emEdicao ? "Deixe em branco para manter" : "App secret"}
                aria-invalid={formState.errors.clientSecret !== undefined}
                {...register("clientSecret")}
              />
              {formState.errors.clientSecret ? (
                <p role="alert" className="mt-1 text-sm text-red-500">
                  {formState.errors.clientSecret.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exchange-accesstoken" className={ROTULO_CLASS}>
                Access Token{" "}
                {emEdicao ? (
                  <span className="text-xs text-orange-400">(vazio = manter o atual)</span>
                ) : null}
              </label>
              <input
                id="exchange-accesstoken"
                type="password"
                className={CAMPO_CLASS}
                placeholder={emEdicao ? "Deixe em branco para manter" : "Token OAuth2"}
                aria-invalid={formState.errors.accessToken !== undefined}
                {...register("accessToken")}
              />
            </div>
            <div>
              <label htmlFor="exchange-refreshtoken" className={ROTULO_CLASS}>
                Refresh Token{" "}
                {emEdicao ? (
                  <span className="text-xs text-orange-400">(vazio = manter o atual)</span>
                ) : null}
              </label>
              <input
                id="exchange-refreshtoken"
                type="password"
                className={CAMPO_CLASS}
                placeholder={emEdicao ? "Deixe em branco para manter" : "Refresh token OAuth2"}
                aria-invalid={formState.errors.refreshToken !== undefined}
                {...register("refreshToken")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exchange-accountid" className={ROTULO_CLASS}>
                Account ID (ctidTraderAccountId){" "}
                <span className="text-xs text-slate-500">(opcional)</span>
              </label>
              <input
                id="exchange-accountid"
                type="text"
                className={CAMPO_CLASS}
                placeholder="Ex: 48366392"
                {...register("accountId")}
              />
            </div>
            <div>
              <label htmlFor="exchange-username" className={ROTULO_CLASS}>
                Username (Login da conta) <span className="text-xs text-slate-500">(opcional)</span>
              </label>
              <input
                id="exchange-username"
                type="text"
                className={CAMPO_CLASS}
                placeholder="Ex: 5886981"
                {...register("username")}
              />
            </div>
          </div>
        </>
      ) : ehFix ? (
        <>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200/80">
            Credenciais da <b>FIX API</b> (Pepperstone/cTrader). Encontre em cTrader → Configurações
            → FIX API. A senha será criptografada (AES-256-GCM). Portas: QUOTE 5211 / TRADE 5212
            (SSL).
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exchange-host" className={ROTULO_CLASS}>
                Host (Quote/Trade)
              </label>
              <input
                id="exchange-host"
                type="text"
                className={CAMPO_CLASS}
                placeholder="Ex: live-us-eqx-01.p.c-trader.com"
                aria-invalid={formState.errors.host !== undefined}
                {...register("host")}
              />
              {formState.errors.host ? (
                <p role="alert" className="mt-1 text-sm text-red-500">
                  {formState.errors.host.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="exchange-sendercompid" className={ROTULO_CLASS}>
                SenderCompID
              </label>
              <input
                id="exchange-sendercompid"
                type="text"
                className={CAMPO_CLASS}
                placeholder="Ex: live.pepperstone.1382148"
                aria-invalid={formState.errors.senderCompId !== undefined}
                {...register("senderCompId")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exchange-username" className={ROTULO_CLASS}>
                Username (Login da conta)
              </label>
              <input
                id="exchange-username"
                type="text"
                className={CAMPO_CLASS}
                placeholder="Ex: 1382148"
                aria-invalid={formState.errors.username !== undefined}
                {...register("username")}
              />
            </div>
            <div>
              <label htmlFor="exchange-password" className={ROTULO_CLASS}>
                Password{" "}
                {emEdicao ? (
                  <span className="text-xs text-orange-400">(vazio = manter o atual)</span>
                ) : null}
              </label>
              <input
                id="exchange-password"
                type="password"
                className={CAMPO_CLASS}
                placeholder={emEdicao ? "Deixe em branco para manter" : "Senha FIX da conta"}
                aria-invalid={formState.errors.password !== undefined}
                {...register("password")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="exchange-quoteport" className={ROTULO_CLASS}>
                Porta Quote (SSL)
              </label>
              <input
                id="exchange-quoteport"
                type="number"
                className={CAMPO_CLASS}
                {...register("quotePort")}
              />
            </div>
            <div>
              <label htmlFor="exchange-tradeport" className={ROTULO_CLASS}>
                Porta Trade (SSL)
              </label>
              <input
                id="exchange-tradeport"
                type="number"
                className={CAMPO_CLASS}
                {...register("tradePort")}
              />
            </div>
            <div>
              <label htmlFor="exchange-targetcompid" className={ROTULO_CLASS}>
                TargetCompID
              </label>
              <input
                id="exchange-targetcompid"
                type="text"
                className={CAMPO_CLASS}
                {...register("targetCompId")}
              />
            </div>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

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
