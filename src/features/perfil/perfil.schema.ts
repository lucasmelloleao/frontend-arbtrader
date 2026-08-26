import {
  boolean,
  email,
  type InferOutput,
  minLength,
  nullable,
  object,
  optional,
  pipe,
  safeParse,
  string,
} from "valibot";

/**
 * Contrato do perfil, espelhado 1:1 do spec do backend (skill `api-contract`).
 *
 * Regra da borda: o schema descreve a FORMA do contrato, não regra de negócio.
 * `minLength(1)` está aqui porque o backend rejeita nome vazio — não é um
 * limiar inventado no front. Qualquer regra que o backend não imponha (limite
 * de caracteres "porque a UI fica feia", faixa de valores, elegibilidade) NÃO
 * entra: authz e regra de negócio são do backend.
 */
export const perfilSchema = object({
  id: string(),
  nome: pipe(string(), minLength(1, "Informe o nome.")),
  email: pipe(string(), email("E-mail inválido.")),
  /** `nullable` porque o spec marca o campo como opcional no cadastro. */
  telefone: nullable(string()),
  /** Ausente no contrato antigo: default `false` (2FA desativado). */
  twoFactorEnabled: optional(boolean(), false),
  /**
   * Integração Telegram: `telegramBotToken` chega mascarado do backend (só o
   * sufixo). `optional` porque o backend pode ainda não devolvê-los — carregar o
   * perfil não pode quebrar se o campo vier ausente.
   */
  telegramChatId: optional(nullable(string())),
  telegramBotToken: optional(nullable(string())),
});

/** Perfil como o backend devolve. Fonte única do tipo — não redeclare à mão. */
export type Perfil = InferOutput<typeof perfilSchema>;

/**
 * Campos editáveis do perfil. Subconjunto do contrato acima: o mesmo schema
 * valida no client (UX, via `valibotResolver`) e é revalidado no server antes
 * de chamar o backend. Validação no client é UX — nunca a fronteira de segurança.
 */
export const perfilFormSchema = object({
  nome: pipe(string(), minLength(1, "Informe o nome.")),
  email: pipe(string(), email("E-mail inválido.")),
});

/** Payload do formulário de perfil. */
export type PerfilFormInput = InferOutput<typeof perfilFormSchema>;

/**
 * Revalida no servidor o payload que já passou pelo `valibotResolver` no client.
 *
 * Mora aqui, e não na Server Action, porque `valibot` é confinado aos
 * `*.schema.ts`: a borda de validação é este arquivo, e quem chama recebe o
 * valor já tipado.
 *
 * @param entrada - Payload cru vindo do formulário.
 * @returns Os campos validados.
 * @throws `Error` com a primeira mensagem de validação.
 */
export function parsePerfilForm(entrada: unknown): PerfilFormInput {
  const resultado = safeParse(perfilFormSchema, entrada);
  if (!resultado.success) {
    // `issues` do valibot é tupla não-vazia: o primeiro item sempre existe.
    throw new Error(resultado.issues[0].message);
  }
  return resultado.output;
}

/**
 * Troca de senha. `confirmacao` é só do formulário (não vai ao backend — o
 * contrato `SenhaChangeRequest` leva `senhaAntiga` e `novaSenha`).
 */
export const trocarSenhaFormSchema = object({
  senhaAntiga: pipe(string(), minLength(1, "Informe a senha atual.")),
  novaSenha: pipe(string(), minLength(6, "A nova senha deve ter no mínimo 6 caracteres.")),
  confirmacao: pipe(string(), minLength(6, "Confirme a nova senha.")),
});

/** Payload do formulário de troca de senha. */
export type TrocarSenhaFormInput = InferOutput<typeof trocarSenhaFormSchema>;

/** Payload enviado ao backend (sem a confirmação). */
export type TrocarSenhaInput = Pick<TrocarSenhaFormInput, "senhaAntiga" | "novaSenha">;

/**
 * Revalida no servidor o formulário de troca de senha e garante que a
 * confirmação bate com a nova senha.
 *
 * @param entrada - Payload cru vindo do formulário.
 * @returns `{ senhaAntiga, novaSenha }` pronto para o backend.
 * @throws `Error` com a primeira mensagem de validação.
 */
export function parseTrocarSenha(entrada: unknown): TrocarSenhaInput {
  const resultado = safeParse(trocarSenhaFormSchema, entrada);
  if (!resultado.success) {
    throw new Error(resultado.issues[0].message);
  }
  if (resultado.output.novaSenha !== resultado.output.confirmacao) {
    throw new Error("A confirmação não confere com a nova senha.");
  }
  return { senhaAntiga: resultado.output.senhaAntiga, novaSenha: resultado.output.novaSenha };
}

/**
 * Código 2FA (TOTP de 6 dígitos) para ativar/desativar.
 */
const codigo2faSchema = object({
  token: pipe(string(), minLength(6, "Informe o código de 6 dígitos.")),
});

/** Payload do código 2FA. */
export type Codigo2faInput = InferOutput<typeof codigo2faSchema>;

/** Secret + otpauth URL devolvidos por POST /perfil/2fa/gerar. */
export const gerar2faSchema = object({
  secret: string(),
  otpauthUrl: string(),
});

/** Resposta de geração de 2FA. */
export type Gerar2fa = InferOutput<typeof gerar2faSchema>;

/**
 * Formulário de integração Telegram. Campos podem ficar vazios: `chatId` vazio
 * limpa a integração; `botToken` vazio significa "não alterar" (evita reenviar o
 * token mascarado como se fosse o integral).
 */
export const telegramFormSchema = object({
  telegramChatId: string(),
  telegramBotToken: string(),
});

/** Payload do formulário de Telegram. */
export type TelegramFormInput = InferOutput<typeof telegramFormSchema>;

/**
 * Revalida no servidor o formulário de Telegram.
 *
 * @param entrada - Payload cru vindo do formulário.
 * @returns Os campos validados.
 * @throws `Error` com a primeira mensagem de validação.
 */
export function parseTelegramForm(entrada: unknown): TelegramFormInput {
  const resultado = safeParse(telegramFormSchema, entrada);
  if (!resultado.success) {
    throw new Error(resultado.issues[0].message);
  }
  return resultado.output;
}
