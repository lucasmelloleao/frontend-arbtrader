/**
 * Rule: boilerplate/no-defensive-parse
 *
 * Proíbe o parse defensivo de borda: um `try` que roda `JSON.parse` /
 * `decodeURIComponent` / `decodeURI` cujo `catch` só engole o erro e devolve um
 * default (`return null | [] | {} | "" | undefined` ou catch vazio).
 *
 * Porquê: no front somos donos das duas pontas (o backend emite o cookie/paylod
 * bem-formado), então esse catch trata um caso que o contrato não produz e ainda
 * esconde erro de verdade. A regra do repo é confiar no tipo e deixar falhar; erro
 * real sobe pro `error.tsx`. Se a entrada for genuinamente não confiável (webhook de
 * terceiro), o certo não é engolir: trate o erro (log/feedback), que já desqualifica
 * o catch aqui.
 *
 * NÃO pega: parse sem try/catch, ou catch que faz mais que devolver default (log,
 * report, throw, múltiplos statements) — aí há tratamento real, não engolir.
 */

const PARSE_CALLEES = new Set(["decodeURIComponent", "decodeURI"]);

/** O `block` do try roda algum parse de borda? (busca em profundidade, ignora `parent`). */
function callsBoundaryParse(block): boolean {
  let found = false;
  const visit = (node) => {
    if (found || !node || typeof node !== "object") return;
    if (node.type === "CallExpression") {
      const callee = node.callee;
      if (callee?.type === "Identifier" && PARSE_CALLEES.has(callee.name)) found = true;
      else if (callee?.type === "MemberExpression" && callee.property?.name === "parse") {
        found = true; // JSON.parse, qualquer x.parse(...)
      }
    }
    for (const key in node) {
      if (key === "parent") continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(block);
  return found;
}

/** O catch só devolve default (ou é vazio), sem throw/log/report? */
function swallows(handlerBody): boolean {
  const statements = handlerBody?.body ?? [];
  if (statements.length === 0) return true;
  if (statements.length !== 1) return false;
  const only = statements[0];
  if (only.type !== "ReturnStatement") return false;
  const arg = only.argument;
  return (
    !arg ||
    arg.type === "Literal" ||
    arg.type === "ArrayExpression" ||
    arg.type === "ObjectExpression" ||
    (arg.type === "Identifier" && arg.name === "undefined")
  );
}

const noDefensiveParse = {
  meta: {
    type: "problem",
    docs: { description: "Proíbe try/catch que engole erro de parse de borda" },
    messages: {
      defensiveParse:
        "Parse de borda com catch que só devolve default engole erro e trata caso fora do contrato. Confie no tipo e deixe falhar, ou trate o erro de verdade (log/feedback).",
    },
  },

  create(context) {
    return {
      TryStatement(node) {
        if (node.handler && callsBoundaryParse(node.block) && swallows(node.handler.body)) {
          context.report({ node: node.handler, messageId: "defensiveParse" });
        }
      },
    };
  },
};

export default noDefensiveParse;
