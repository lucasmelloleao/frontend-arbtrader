/**
 * Rule: boilerplate/no-derived-state-in-effect (CONSERVADORA)
 *
 * Reports o anti-pattern "You Might Not Need an Effect": um useEffect cujo corpo
 * é UM ÚNICO setState derivado das dependências. Derive durante o render.
 *
 * De propósito conservadora: só dispara no caso inequívoco (corpo = 1 statement
 * que é `setX(...)` e deps não-vazias). Effects legítimos (subscription, cleanup,
 * múltiplos statements, sincronização com sistema externo) NÃO são tocados, pra
 * evitar falso-positivo que faria o agente "consertar" código correto.
 */

import { isEffectCallee } from "./_effect-utils.ts";

/** `setX(...)`: CallExpression cujo callee é um Identifier `set[A-Z]…`. */
function isSetterCall(expr) {
  return (
    expr?.type === "CallExpression" &&
    expr.callee?.type === "Identifier" &&
    /^set[A-Z]/.test(expr.callee.name)
  );
}

function isSetterStatement(stmt) {
  return stmt?.type === "ExpressionStatement" && isSetterCall(stmt.expression);
}

const noDerivedStateInEffect = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow useEffect whose only body is a setState derived from its deps.",
    },
    messages: {
      derivedState:
        "useEffect que só faz setState derivado das deps é anti-pattern. Derive durante o render.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isEffectCallee(node.callee)) return;

        const args = node.arguments;
        const callback = args[0];
        const deps = args[1];

        if (
          !callback ||
          (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression")
        ) {
          return;
        }

        // "derivado das deps" → exige array de deps não-vazio.
        if (!deps || deps.type !== "ArrayExpression" || (deps.elements?.length ?? 0) === 0) {
          return;
        }

        const body = callback.body;
        if (!body) return;

        // Arrow concisa: useEffect(() => setX(a), [a])  (corpo = a própria call)
        if (isSetterCall(body)) {
          context.report({ node, messageId: "derivedState" });
          return;
        }

        // Bloco com exatamente 1 statement que é um setState.
        if (body.type === "BlockStatement") {
          const statements = body.body;
          if (statements.length === 1 && isSetterStatement(statements[0])) {
            context.report({ node, messageId: "derivedState" });
          }
        }
      },
    };
  },
};

export default noDerivedStateInEffect;
