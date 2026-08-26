/**
 * Rule: boilerplate/no-manual-memo
 *
 * O projeto usa React Compiler (react/react-compiler = error), que memoiza
 * automaticamente. useMemo/useCallback/React.memo escritos à mão viram ruído
 * redundante e podem até atrapalhar a saída do compiler.
 *
 * Dispara em: useMemo(...), useCallback(...), memo(...) e os equivalentes
 * React.useMemo/React.useCallback/React.memo.
 *
 * Não há escape hatch: supressão de lint é proibida no repo (ver
 * `tooling/no-lint-suppression.ts`). Se o compiler realmente não enxergar a
 * borda — valor que vira dependência de effect, integração com lib externa —,
 * o caminho é mudar o desenho (estabilizar o valor na origem, mover o cálculo
 * pra fora do render), não silenciar a regra.
 */

const MEMO_NAMES = new Set(["useMemo", "useCallback", "memo"]);

/** Retorna o nome da API de memoização (useMemo/useCallback/memo) ou null. */
function memoName(callee) {
  if (!callee) return null;
  if (callee.type === "Identifier" && MEMO_NAMES.has(callee.name)) {
    return callee.name;
  }
  if (
    callee.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "React" &&
    callee.property?.type === "Identifier" &&
    MEMO_NAMES.has(callee.property.name)
  ) {
    return callee.property.name;
  }
  return null;
}

const noManualMemo = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow manual useMemo/useCallback/React.memo; React Compiler memoizes automatically.",
    },
    messages: {
      manualMemo:
        "React Compiler memoiza sozinho — useMemo/useCallback/memo manual é redundante. Remova a memoização manual.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (memoName(node.callee)) {
          context.report({ node, messageId: "manualMemo" });
        }
      },
    };
  },
};

export default noManualMemo;
