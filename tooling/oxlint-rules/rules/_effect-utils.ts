/**
 * Utilitários compartilhados pelas regras de effect (no-fetch-in-effect,
 * no-watch-in-effect, no-derived-state-in-effect). Fonte única: evita que a
 * detecção de hooks/parent-walk divirja entre as regras.
 */

const EFFECT_HOOKS = new Set(["useEffect", "useLayoutEffect"]);

/** Verdadeiro se `callee` é useEffect/useLayoutEffect (forma direta ou React.useEffect). */
export function isEffectCallee(callee) {
  if (!callee) return false;
  if (callee.type === "Identifier") return EFFECT_HOOKS.has(callee.name);
  if (callee.type === "MemberExpression") {
    return (
      callee.object?.type === "Identifier" &&
      callee.object.name === "React" &&
      callee.property?.type === "Identifier" &&
      EFFECT_HOOKS.has(callee.property.name)
    );
  }
  return false;
}

/** Sobe pela cadeia de `parent` e retorna true se `node` está dentro de um effect. */
export function insideEffect(node) {
  let cur = node.parent;
  while (cur) {
    if (cur.type === "CallExpression" && isEffectCallee(cur.callee)) return true;
    cur = cur.parent;
  }
  return false;
}
