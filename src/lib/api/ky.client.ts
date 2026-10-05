import ky from "ky";

import { getClientApiBaseUrl } from "@/lib/api/base-url";

/**
 * Instância ky para chamadas do browser ao backend.
 *
 * Existe só para os fluxos que precisam do `Set-Cookie` do backend pousando no
 * browser — login, logout e refresh. Leitura de dado NÃO passa por aqui: é RSC
 * via `kyServer` (ver ARCHITECTURE.md).
 *
 * `credentials: "include"` faz o browser enviar e receber o cookie HttpOnly de
 * sessão automaticamente. Usada apenas via `apiClient`, que valida toda resposta
 * na borda.
 */
export const kyClient = ky.create({
  baseUrl: getClientApiBaseUrl(),
  credentials: "include",
  throwHttpErrors: true,
  headers: {
    Accept: "application/json",
  },
});
