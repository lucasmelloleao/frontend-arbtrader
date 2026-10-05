"use client";

import { Bot, HelpCircle, MessageSquare, Send } from "lucide-react";

import { useTelegramForm } from "@/features/perfil/use-telegram-form";
import type { Perfil } from "@/features/perfil/perfil.schema";

type TelegramFormProps = {
  perfil: Perfil;
};

const CAMPO_CLASS =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500";

const ROTULO_CLASS = "mb-1 block text-sm text-slate-400";

/**
 * Card de integração com o Telegram: bot token + chat ID e um passo a passo de
 * como obtê-los no @BotFather/@userinfobot. Estado e submit vivem no
 * `useTelegramForm`; a mutação é a Server Action `salvarTelegram`.
 */
export function TelegramForm({ perfil }: TelegramFormProps): React.ReactNode {
  const { form, enviar, erroServidor, salvo } = useTelegramForm(perfil);
  const { register } = form;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm lg:col-span-2">
      <div className="mb-6 flex items-center gap-2">
        <Send className="h-5 w-5 text-indigo-400" aria-hidden="true" />
        <h4 className="text-lg font-medium text-white">Integração com o Telegram</h4>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        Configure seu <strong>Bot Token</strong> (do{" "}
        <code className="rounded bg-slate-950 px-1.5 py-0.5 text-indigo-300">@BotFather</code>) e
        seu <strong>Chat ID</strong> (do{" "}
        <code className="rounded bg-slate-950 px-1.5 py-0.5 text-indigo-300">@userinfobot</code>)
        para receber notificações em tempo real de abertura, fechamento de posições e erros.
      </p>

      {erroServidor === null ? null : (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {erroServidor}
        </div>
      )}
      {salvo ? (
        <div className="mb-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          Configurações do Telegram salvas com sucesso!
        </div>
      ) : null}

      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="telegram-bot-token" className={ROTULO_CLASS}>
              Telegram Bot Token
            </label>
            <div className="relative">
              <Bot
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="telegram-bot-token"
                type="password"
                autoComplete="off"
                className={`${CAMPO_CLASS} pl-10 font-mono`}
                placeholder={
                  perfil.telegramBotToken
                    ? `Já configurado (${perfil.telegramBotToken}) — deixe vazio para manter`
                    : "8523015362:AAE80zQhff..."
                }
                {...register("telegramBotToken")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="telegram-chat-id" className={ROTULO_CLASS}>
              Telegram Chat ID
            </label>
            <div className="relative">
              <MessageSquare
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="telegram-chat-id"
                type="text"
                className={`${CAMPO_CLASS} pl-10 font-mono`}
                placeholder="999232604"
                {...register("telegramChatId")}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Configurações do Telegram"}
          </button>
        </div>
      </form>

      {/* Passo a passo / tutorial Telegram */}
      <div className="mt-8 space-y-4 border-t border-slate-800 pt-6">
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          <span>Passo a Passo: como obter o Bot Token e o Chat ID no Telegram</span>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-400">
                1
              </span>
              <span>Criar o seu Bot</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              No Telegram, busque por <strong>@BotFather</strong>, inicie a conversa e envie o
              comando <code className="text-indigo-300">/newbot</code>.
            </p>
            <p className="leading-relaxed text-slate-400">
              Escolha o nome do seu robô e copie o <strong>HTTP API Token</strong> gerado (ex:{" "}
              <code className="text-slate-300">852301...</code>).
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-400">
                2
              </span>
              <span>Descobrir o seu Chat ID</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Busque pelo bot <strong>@userinfobot</strong> ou <strong>@raw_data_bot</strong> e
              envie o comando <code className="text-indigo-300">/start</code>.
            </p>
            <p className="leading-relaxed text-slate-400">
              Copie o número retornado no campo <strong>Id</strong> (ex:{" "}
              <code className="text-slate-300">999232604</code>).
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-400">
                3
              </span>
              <span>Ativar o Bot</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Abra a conversa direta com o <strong>seu bot recém-criado</strong> no Telegram e
              clique em <strong>/start</strong>.
            </p>
            <p className="leading-relaxed text-slate-400">
              Preencha os campos acima, clique em <strong>Salvar</strong> e pronto! Você passará a
              receber notificações em tempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
