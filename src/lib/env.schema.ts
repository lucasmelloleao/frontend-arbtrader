import { getDotPath, type InferOutput, object, pipe, safeParse, string, url } from "valibot";

/**
 * Env do servidor. Mora num `*.schema.ts` porque valibot é confinado a esses
 * arquivos (`no-restricted-imports` + `boilerplate/no-forbidden-imports`): a
 * validação de env é borda como qualquer outra.
 *
 * Só o que o servidor precisa entra aqui. Env `NEXT_PUBLIC_*` é inlinada pelo
 * Next no bundle do browser e não passa por este schema — ver `lib/api/base-url`.
 */
const serverEnvSchema = object({
  // Chave ausente é reportada pelo `object` (o valibot não usa a mensagem do
  // `string` nesse caso), e o `getDotPath` abaixo já nomeia a variável no erro.
  /** Base URL do backend para chamadas server-to-server (RSC e Server Actions). */
  INTERNAL_API_URL: pipe(string(), url("INTERNAL_API_URL precisa ser uma URL absoluta.")),
});

export type ServerEnv = InferOutput<typeof serverEnvSchema>;

/**
 * Valida as variáveis do servidor e devolve o objeto tipado.
 *
 * Falha fechado: env ausente ou malformada é erro de configuração, e estourar no
 * boot é melhor do que descobrir com um `fetch` para `undefined/rota` em produção.
 *
 * @param source - Fonte das variáveis (normalmente `process.env`).
 * @returns Env do servidor validada.
 * @throws `Error` listando as variáveis inválidas.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = safeParse(serverEnvSchema, source);

  if (!result.success) {
    const problems = result.issues
      .map((issue) => `${getDotPath(issue)}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuração de ambiente inválida:\n${problems}`);
  }

  return result.output;
}
