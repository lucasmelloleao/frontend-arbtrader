import { check, email, type InferOutput, minLength, object, pipe, string } from "valibot";

/**
 * Credenciais de login, espelhando o contrato do backend.
 *
 * `codigo2fa` é opcional: vazio no login normal, 6 dígitos quando o backend
 * sinaliza 2FA habilitado (erro de negócio "2fa_required"). A regra de 6
 * dígitos é formato de entrada, não política de segurança — o backend valida
 * o TOTP.
 */
export const loginSchema = object({
  email: pipe(string(), email("E-mail inválido.")),
  senha: pipe(string(), minLength(1, "Informe a senha.")),
  codigo2fa: pipe(
    string(),
    check((valor) => valor === "" || /^\d{6}$/.test(valor), "Código 2FA deve ter 6 dígitos."),
  ),
});

/** Payload do formulário de login. */
export type LoginInput = InferOutput<typeof loginSchema>;
