/**
 * Fakes de `fetch` pros testes que exercitam o `apiClient`: respondem o envelope
 * JSON do backend sem rede. Ficam aqui, e não em cada teste, porque a borda de
 * IO é uma só — é nela que o mock entra (ver AGENTS.md > Testes).
 */

/**
 * `fetch` falso que responde o envelope e o status informados.
 *
 * @param body - Corpo JSON da resposta (envelope do backend).
 * @param status - Status HTTP a devolver.
 */
export function fetchReturning(body: unknown, status: number): typeof fetch {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
}

/**
 * `fetch` falso que rejeita como uma falha de transporte (rede, DNS, CORS):
 * nunca chega ao backend, então não há envelope na resposta.
 */
export function fetchFailing(reason: string): typeof fetch {
  return () => Promise.reject(new TypeError(reason));
}
