/**
 * UserPromptSubmit / beforeSubmitPrompt — reforço por turno.
 * Nunca bloqueia o prompt do usuário.
 */

import { emitAdditionalContext, readHookInput } from "./host.ts";

const REINFORCEMENT = `# Reforço por turno — REGRA, não opção (julgamento que o lint NÃO pega)
- Runtime e ferramentas do projeto são 100% Bun. Nunca execute \`node\` nem introduza outro runtime, package manager ou runner.
- Faça só o que o prompt pede. Não invente regra de negócio, validação de regra de negócio ou authz no frontend: isso pertence ao backend. Leia a regra/gate real e não amplie o escopo que ela efetivamente casa; em dúvida, PERGUNTE.
- Faça a menor mudança de boundary que resolve o requisito. Sem escopo adjacente, camada cerimonial ou future-proofing.
- Um caller fica inline; extração local comum começa no 2º caller real. Abstração genérica reutilizável (framework, provider, factory ou hook genérico) exige pelo menos 3 callers/usos concretos. Primitivo concreto cross-feature pode ir em \`shared\` no 1º write (colocação, não abstração).
- Confie nos contratos tipados: sem wrapper que só repassa, helper de narrowing cerimonial, fallback para shape impossível ou try/catch que fabrica valor plausível. Sem re-parse defensivo de URL que o próprio app emitiu; ids de catálogo via registry const, não literal solto.
- Nunca suprima lint por comentário/diretiva nem desative regra pra passar o gate: corrija a causa.
- Erro do backend nunca vira workaround no frontend. Reporte e pergunte como proceder, recomendando corrigir o backend; contorno no front exige aval explícito.
- Erro visível recebe feedback seguro; erro server-side recebe contexto útil sem vazar segredo, token ou cookie. Nunca engula erro silenciosamente.
- Pare quando o requisito estiver atendido e os gates passarem; sem refactor, documentação ou cleanup fora de escopo.`;

const { host } = await readHookInput();
emitAdditionalContext(host, "UserPromptSubmit", REINFORCEMENT, {
  continue: true,
});
