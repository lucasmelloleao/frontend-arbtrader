/**
 * Resolve a base URL do backend para o cliente HTTP do browser (`kyClient`).
 *
 * O `kyClient` só existe para os fluxos browser-direct — login, logout e refresh,
 * onde o `Set-Cookie` HttpOnly do backend precisa pousar no browser. No servidor
 * a instância é criada mas nunca dispara requisição, então sem `window` devolve
 * `"/"` e não exige env: build e prerender ficam livres de configuração.
 *
 * `NEXT_PUBLIC_API_URL` aceita dois formatos, e a escolha é sobre onde o cookie
 * pousa:
 * - **`"/"` (same-origin):** o backend responde no mesmo origin do app. Em dev
 *   isso vem do rewrite `/api/*` do `next.config.ts` (comentado por padrão);
 *   em produção, de um domínio same-site. É o único jeito de um cookie HttpOnly
 *   de login pousar sem depender de `SameSite=None`.
 * - **URL absoluta:** backend em outro origin. Exige CORS com
 *   `Access-Control-Allow-Credentials` no backend e cookie `SameSite=None; Secure`.
 *
 * @returns Base URL usada como `baseUrl` do `kyClient`.
 */
export function getClientApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL não configurada. Copie o .env.example para .env.local e preencha.",
    );
  }
  return baseUrl;
}
