/**
 * Rule: boilerplate/no-fetch-in-effect
 *
 * Reports data fetching inside useEffect/useLayoutEffect. Na arquitetura
 * RSC-puro, busca de dados é em Server Component ou Server Action: nunca num
 * effect de client (não usamos lib de data-fetching no client).
 *
 * Dispara em: fetch(), apiClient(), ky/kyClient/kyServer.* dentro de um effect.
 */

import { insideEffect } from "./_effect-utils.ts";

const FETCH_NAMES = new Set(["fetch", "apiClient"]);
const KY_OBJECTS = new Set(["ky", "kyClient", "kyServer"]);

function isFetchCall(callee) {
  if (!callee) return false;
  if (callee.type === "Identifier") return FETCH_NAMES.has(callee.name);
  if (callee.type === "MemberExpression") {
    return callee.object?.type === "Identifier" && KY_OBJECTS.has(callee.object.name);
  }
  return false;
}

const noFetchInEffect = {
  meta: {
    type: "problem",
    docs: { description: "Disallow data fetching inside useEffect; use RSC or Server Actions." },
    messages: {
      fetchInEffect:
        "Não busque dados em useEffect. Leitura de dados é em Server Component (RSC); mutação é Server Action.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isFetchCall(node.callee)) return;
        if (insideEffect(node)) context.report({ node, messageId: "fetchInEffect" });
      },
    };
  },
};

export default noFetchInEffect;
