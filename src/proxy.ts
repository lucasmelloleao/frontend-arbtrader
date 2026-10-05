import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Cookie HttpOnly de sessão emitido pelo backend no login. É a fonte de verdade
 * de "tem sessão"; o front nunca decodifica, valida ou assina o JWT que ele
 * carrega (ADR-007). Trocar o nome aqui é o único ajuste se o seu backend usar
 * outro.
 */
const SESSION_COOKIES = ["session_token", "token", "connect.sid"];

/**
 * Trava de request-boundary das áreas autenticadas. É o `proxy.ts` do Next 16,
 * que substitui o `middleware.ts` — e mora na raiz de `src`, irmão de `app/`,
 * não dentro dele.
 *
 * Sem o cookie, o visitante não passou pelo login e é mandado pra `/login` antes
 * de qualquer HTML sair, sem flash.
 *
 * É gate de **roteamento**, não autorização. A autorização real é sempre do
 * backend, que rejeita as chamadas de dado independentemente do que o cookie
 * diga; aqui o objetivo é não largar o usuário numa tela que responderia 403.
 * Validade, expiração e refresh rolante ficam por conta do backend — e, quando
 * você precisar de refresh proativo, é aqui que ele entra, relayando o
 * `Set-Cookie` da resposta.
 *
 * @param request - Requisição interceptada (só as rotas do `matcher`).
 * @returns Segue o fluxo quando há sessão; senão redireciona pra `/login`.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * Áreas autenticadas. Entre por prefixo, não rota a rota: listar rota a rota
 * deixa toda rota nova sem gate por padrão, que é o erro caro.
 */
export const config = {
  matcher: ["/perfil/:path*", "/dashboard/:path*"],
};
