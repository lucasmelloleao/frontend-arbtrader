/**
 * PostToolUse Edit|Write|apply_patch / postToolUse Write — reforço na escrita.
 */

import { emitAdditionalContext, isWriteEvent, readEditedFilePath, readHookInput } from "./host.ts";

const CORE = `- Sem fallback defensivo pra caso que o tipo já impede (?? '', || [], || {}, ?? 0, try/catch que engole). Confie no tipo, fail-fast. Sem \`assert\`, \`!\` ou \`as\`.
- Erro do backend NÃO vira workaround no front: reporte e pergunte; recomendado é SEMPRE corrigir o backend primeiro.
- YAGNI: nada de abstração/wrapper/helper/arquivo novo com 1 uso real. Inline no call site até o 2º caller aparecer. Reuse o que já existe no repo.
- Primitivo cross-feature (calendar, DateRangePicker, formatters) pode ir direto em shared (colocação ≠ abstração genérica). Normalizer só na borda externa; id de catálogo via const registry (não literal em if/===); URL que nós escrevemos → redirect/canônico, não re-parse defensivo; tipagem third-party larga demais → corrija o tipo na importação (sem !, assert, if/throw cerimonial nem ?? 0).
- Nunca suprima lint por diretiva pra passar o gate: corrija a causa.
- Se algo ficou ambíguo ou você assumiu uma regra: PERGUNTE, não adivinhe.`;

const TS_ONLY = `- Schema/borda: sem regra de negócio/validação/authz inventada (limiar mágico tipo minValue(5), range que a UI só exibe). Isso é do backend; o schema só descreve a forma do contrato.
- Sem wrapper que só repassa pro apiClient/outra função, e sem helper cerimonial (isRecord, ensureArray) quando o tipo já garante.
- Nome concreto (não data/item/helper); hook useXxx isola estado/efeito; transform pesado mora na lib.`;

const TSX_ONLY = `- .tsx = UI fina (SRP): estado/efeito/lógica/transform vão pra hook useXxx ou lib; o componente só compõe e renderiza.
- Sem valor hardcoded (cor/px/raio/sombra/fonte) — sai de token do theme (DESIGN.md). Badge/Button/Card variam por prop/variant, nunca estilo copiado inline.
- Form: nada de watch()/form.watch() no corpo — use useWatch ou derive no render.
- Acessibilidade é done: controle interativo real com nome acessível, teclado, e estados loading/empty/error quando a UI depende deles. Mídia raster via next/image (WebP/AVIF).`;

const { host, raw } = await readHookInput();

if (raw.__invalid_json === true || !isWriteEvent(raw)) {
  process.exit(0);
}

const path = readEditedFilePath(raw);
const isSource = /(^|[\\/])src[\\/]/.test(path) && !/\.test\.tsx?$/.test(path);
const isTsx = path.endsWith(".tsx");
const isTs = path.endsWith(".ts");

if (!isSource || (!isTs && !isTsx)) {
  process.exit(0);
}

const reminder = `# Você acabou de escrever ${isTsx ? "um componente (.tsx)" : "lógica (.ts)"} — revise antes de seguir
${CORE}
${isTsx ? TSX_ONLY : TS_ONLY}`;

emitAdditionalContext(host, "PostToolUse", reminder);
