/**
 * Rule: boilerplate/no-watch-in-effect
 *
 * Reports react-hook-form `watch(...)` usado dentro de useEffect/useLayoutEffect
 * (no corpo OU no array de dependências). É o anti-pattern clássico de re-render
 * por effect. Use `useWatch`/`Controller`, ou derive durante o render.
 *
 * Pega tanto `watch(...)` (destructurado de useForm) quanto `form.watch(...)` /
 * `methods.watch(...)` (MemberExpression: o uso mais comum do RHF).
 */

import { insideEffect } from "./_effect-utils.ts";

function isWatchCallee(callee) {
  if (!callee) return false;
  // watch("field") : destructurado de useForm()
  if (callee.type === "Identifier") return callee.name === "watch";
  // form.watch("field") / methods.watch(...)
  if (callee.type === "MemberExpression") {
    return (
      !callee.computed && callee.property?.type === "Identifier" && callee.property.name === "watch"
    );
  }
  return false;
}

const noWatchInEffect = {
  meta: {
    type: "problem",
    docs: { description: "Disallow react-hook-form watch() inside useEffect." },
    messages: {
      watchInEffect:
        "Não use watch() em useEffect. Use useWatch/Controller, ou derive durante o render.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isWatchCallee(node.callee)) return;
        if (insideEffect(node)) context.report({ node, messageId: "watchInEffect" });
      },
    };
  },
};

export default noWatchInEffect;
