"use server";

import { revalidatePath } from "next/cache";

import {
  gerar2faSchema,
  parsePerfilForm,
  parseTelegramForm,
  parseTrocarSenha,
  perfilSchema,
  type Codigo2faInput,
  type Gerar2fa,
  type PerfilFormInput,
  type TelegramFormInput,
  type TrocarSenhaFormInput,
} from "@/features/perfil/perfil.schema";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { kyServer } from "@/lib/api/ky.server";

/**
 * Resultado da mutação, no formato que o `useActionState` do React 19 consome.
 * `erro` carrega a mensagem que o backend devolveu — texto já seguro pra UI.
 */
export type MutacaoResult = { ok: true } | { ok: false; erro: string };

/** Resultado da geração de 2FA: devolve o secret + otpauthUrl. */
export type Gerar2faResult = { ok: true; dados: Gerar2fa } | { ok: false; erro: string };

/** Texto de último recurso: falha sem `Error` não tem mensagem própria pra mostrar. */
const ERRO_INESPERADO = "Não foi possível concluir. Tente novamente.";

/**
 * Salva o perfil do usuário autenticado.
 *
 * Revalida no servidor mesmo o formulário já tendo validado no client: validação
 * de client é UX, não fronteira de segurança. Depois do sucesso, `revalidatePath`
 * repuxa o RSC — é assim que o dado volta fresco, já que o repo não tem cache.
 *
 * @param entrada - Campos editáveis vindos do formulário.
 * @returns `{ ok: true }` ou `{ ok: false, erro }` com a mensagem do backend.
 */
export async function salvarPerfil(entrada: PerfilFormInput): Promise<MutacaoResult> {
  try {
    const validado = parsePerfilForm(entrada);
    // Sem schema: o contrato deste endpoint não devolve `data`, só o envelope.
    await apiClient(kyServer, API_ENDPOINTS.perfil.me, undefined, {
      method: "put",
      json: validado,
    });
  } catch (error: unknown) {
    // O `apiClient` já converteu a falha na mensagem segura do backend (ou no
    // texto de conexão). Repassar aqui é entregar feedback, não engolir erro.
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/**
 * Salva a integração do Telegram (chat ID + token do bot).
 *
 * O PUT `/perfil` exige `nome`, então busca o perfil atual, monta o payload e
 * envia. Semântica de limpeza: `chatId` vazio limpa a integração (`null`);
 * `botToken` vazio não altera (evita gravar o token mascarado).
 *
 * @param entrada - Campos vindos do formulário de Telegram.
 * @returns `{ ok: true }` ou `{ ok: false, erro }` com a mensagem do backend.
 */
export async function salvarTelegram(entrada: TelegramFormInput): Promise<MutacaoResult> {
  try {
    const validado = parseTelegramForm(entrada);
    const perfil = await apiClient(kyServer, API_ENDPOINTS.perfil.me, perfilSchema);
    const payload: Record<string, string | null> = {
      nome: perfil.nome,
      email: perfil.email,
      telegramChatId: validado.telegramChatId.trim() || null,
    };
    // Token vazio = não alterar (o campo não é pré-preenchido com o mascarado).
    const token = validado.telegramBotToken.trim();
    if (token) {
      payload.telegramBotToken = token;
    }
    await apiClient(kyServer, API_ENDPOINTS.perfil.me, undefined, {
      method: "put",
      json: payload,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/**
 * Troca a senha do usuário autenticado.
 *
 * @param entrada - Senha atual + nova senha (a confirmação é validada no form).
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function trocarSenha(entrada: TrocarSenhaFormInput): Promise<MutacaoResult> {
  try {
    const validado = parseTrocarSenha(entrada);
    await apiClient(kyServer, API_ENDPOINTS.perfil.senha, undefined, {
      method: "post",
      json: validado,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  return { ok: true };
}

/**
 * Gera um novo secret de 2FA (e a URL otpauth para o QR Code).
 *
 * @returns `{ ok: true, dados }` com `secret` e `otpauthUrl`, ou erro.
 */
export async function gerar2fa(): Promise<Gerar2faResult> {
  try {
    const dados = await apiClient(kyServer, API_ENDPOINTS.perfil.gerar2fa, gerar2faSchema, {
      method: "post",
    });
    return { ok: true, dados };
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
}

/**
 * Ativa o 2FA validando o código TOTP.
 *
 * @param entrada - Código de 6 dígitos.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function ativar2fa(entrada: Codigo2faInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perfil.ativar2fa, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/**
 * Desativa o 2FA validando o código TOTP atual.
 *
 * @param entrada - Código de 6 dígitos.
 * @returns `{ ok: true }` ou `{ ok: false, erro }`.
 */
export async function desativar2fa(entrada: Codigo2faInput): Promise<MutacaoResult> {
  try {
    await apiClient(kyServer, API_ENDPOINTS.perfil.desativar2fa, undefined, {
      method: "post",
      json: entrada,
    });
  } catch (error: unknown) {
    return { ok: false, erro: error instanceof Error ? error.message : ERRO_INESPERADO };
  }
  revalidatePath("/dashboard/profile");
  return { ok: true };
}
