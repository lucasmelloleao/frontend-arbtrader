import ky from "ky";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";

/**
 * Instância ky para leituras de dado em Server Components e Server Actions.
 *
 * Encaminha os cookies da requisição atual (via `next/headers`) pro backend, que
 * é quem valida a sessão e a autorização. O hook roda a cada chamada, então a
 * instância é única mas o cookie é sempre o da request corrente; ler `cookies()`
 * também marca a rota como dinâmica, o que garante dado sempre fresco (doutrina
 * sem stale cache do repo) e, por só existir no servidor, impede este client de
 * vazar pro bundle do browser.
 *
 * Fluxos que precisam do `Set-Cookie` da resposta pousando no browser (login,
 * logout, refresh) NÃO passam por aqui: usam o `kyClient` browser-direct, porque
 * cookie re-emitido numa chamada server-side se perde.
 */
export const kyServer = ky.create({
  baseUrl: serverEnv.INTERNAL_API_URL,
  throwHttpErrors: true,
  headers: {
    Accept: "application/json",
  },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const cookieHeader = (await cookies()).toString();
        if (cookieHeader) {
          request.headers.set("cookie", cookieHeader);
        }
      },
    ],
  },
});
