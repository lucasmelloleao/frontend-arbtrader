/**
 * Rule: boilerplate/no-force-static
 * Disallows Next.js route segment exports that opt in to static rendering
 * against the developer's intent:
 *
 *   export const dynamic = "force-static"  → error
 *   export const revalidate = <number > 0> → error
 *   export const revalidate = false         → error (never-revalidate = estático permanente)
 *
 * Allowed:
 *   export const dynamic = "force-dynamic" → ok
 *   export const revalidate = 0            → ok (ISR disabled, not forced-static)
 *
 * Escopo: só `src/app/**`: `dynamic`/`revalidate` são route segment config e só
 * têm efeito em rotas; fora disso seria falso-positivo.
 */

import { getFilename } from "./_context-utils.ts";

const noForceStatic = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Disallow `dynamic = "force-static"` and positive `revalidate` values in route segments',
    },
    messages: {
      forceStatic:
        'Setting `dynamic` to "force-static" forces static rendering. Use "force-dynamic" or remove the export.',
      staleRevalidate:
        "`revalidate` diferente de 0 força cache/staleness (número > 0 = ISR; false = never-revalidate/estático permanente). Use 0 (sempre fresco).",
    },
  },

  create(context) {
    // Só atua em route segments (src/app/**). Regex com `(^|/)` pega tanto path
    // ABSOLUTO (/.../src/app/…) quanto RELATIVO (src/app/…): o oxlint reporta
    // relativo em runs normais, então um `.includes("/src/app/")` daria
    // falso-negativo.
    if (!/(^|\/)src\/app\//.test(getFilename(context).replace(/\\/g, "/"))) {
      return {};
    }
    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl || decl.type !== "VariableDeclaration") return;

        for (const declarator of decl.declarations) {
          if (declarator.id.type !== "Identifier") continue;
          const name = declarator.id.name;
          const init = declarator.init;
          if (!init) continue;

          if (name === "dynamic" && init.type === "Literal" && init.value === "force-static") {
            context.report({ node: declarator, messageId: "forceStatic" });
          }

          // revalidate != 0 força cache/staleness: número > 0 (ISR) OU `false`
          // (never-revalidate = estático permanente). Só `0` é permitido.
          if (
            name === "revalidate" &&
            init.type === "Literal" &&
            (init.value === false || (typeof init.value === "number" && init.value > 0))
          ) {
            context.report({ node: declarator, messageId: "staleRevalidate" });
          }
        }
      },
    };
  },
};

export default noForceStatic;
