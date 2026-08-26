/**
 * Resolução de filename única e fail-loud para as regras que dependem do path.
 *
 * A API de jsPlugins do oxlint é alpha (oxlint pinado em 1.77.0). Se um bump
 * futuro remover/renomear getFilename/filename, queremos que o lint QUEBRE ALTO
 * (erro visível): não que as regras de fronteira passem a aprovar tudo em
 * silêncio, que é o pior cenário para código gerado por agente.
 */
export function getFilename(context): string {
  const fn = context.getFilename?.() ?? context.filename;
  if (typeof fn !== "string" || fn.length === 0) {
    throw new Error(
      "[boilerplate oxlint] não foi possível determinar o filename: a API do plugin oxlint mudou? (pinned 1.77.0)",
    );
  }
  return fn;
}
