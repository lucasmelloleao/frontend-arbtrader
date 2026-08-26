/**
 * Pré-push guard: orçamento de peso para QUALQUER asset servido de `public/`.
 *
 * Tudo em `public/` é baixado pelo cliente. Asset pesado na origem é o gargalo
 * nº1 de LCP: imagem, fonte, ou o que for. O budget é universal e independe do
 * formato. Não há allowlist: exceção por formato ou diretório vira buraco no
 * gate (foto disfarçada de PNG é o caso clássico que fura qualquer allowlist de
 * extensão).
 *
 * Este guard não julga formato (não lê os bytes do arquivo), só PESO. Imagem
 * raster legítima vira WebP/AVIF via next/image na saída; o gate aqui é só o
 * limite de tamanho na origem. Se um asset legítimo precisar passar do limite,
 * a decisão é consciente: ajuste o BUDGET aqui com justificativa, não suba
 * binário pesado calado.
 *
 * Roda em Bun (sem node). Sai 1 (falha o push) ao achar qualquer violação.
 * Wiring: lefthook.yml > pre-push > `bun tooling/no-heavy-public-assets.ts`.
 * O glob é relativo ao cwd (raiz do repo), então aponta pro `public/` do
 * boilerplate quando roda da raiz.
 */

const BUDGET_BYTES = 200 * 1024;

const glob = new Bun.Glob("public/**/*");
const offenders: string[] = [];

for (const path of glob.scanSync(".")) {
  const size = Bun.file(path).size;
  if (size > BUDGET_BYTES) {
    // Normaliza pra `/` (o glob devolve o separador nativo; no Windows é `\`).
    offenders.push(`${(size / 1024).toFixed(0)} KB\t${path.replaceAll("\\", "/")}`);
  }
}

if (offenders.length > 0) {
  process.stderr.write(
    `Asset acima do budget de ${BUDGET_BYTES / 1024} KB em public/:\n` +
      `${offenders.join("\n")}\n` +
      "Reduza o peso na origem (imagem raster vira WebP/AVIF; corte dimensões/qualidade).\n",
  );
  process.exit(1);
}
