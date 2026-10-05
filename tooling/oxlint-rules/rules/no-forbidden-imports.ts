/**
 * Rule: boilerplate/no-forbidden-imports
 *
 * Closes the subpath gap left by exact `no-restricted-imports` entries.
 * `no-restricted-imports` only matches the exact specifier, so a subpath
 * import slips through. Examples:
 *   - `swr/mutation` is still SWR.
 *   - `@tanstack/react-query/devtools` is still React Query.
 *   - `zod/v4-mini` is still Zod (this repo uses valibot).
 *   - `jose/jwt/verify` is still a JWT library (authz belongs to the backend).
 */

import { getFilename } from "./_context-utils.ts";

const ALWAYS_FORBIDDEN = [
  // Data fetching / cache no client — leitura é RSC, sempre fresco.
  "swr",
  "@tanstack/react-query",
  "@tanstack/react-query-devtools",
  "@tanstack/query-core",
  "react-query",
  // HTTP fora do gateway — todo backend passa por ky em src/lib/api.
  "axios",
  // Validação fora da borda — este repo usa valibot em *.schema.ts.
  "zod",
  // JWT no front — o backend é a fonte da verdade de authz.
  "jsonwebtoken",
  "jose",
];

function matchesPackage(source: string, pkg: string): boolean {
  return source === pkg || source.startsWith(`${pkg}/`);
}

const noForbiddenImports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow forbidden data/http libraries and enforce valibot/ky zones, including package subpaths.",
    },
    messages: {
      forbidden:
        "Import proibido neste repo. Leitura é RSC/Server Actions/apiClient, validação é valibot em *.schema.ts, e authz é sempre no backend.",
      valibotZone: "valibot só pode ser importado em arquivos *.schema.ts.",
      kyZone: "ky só pode ser importado dentro de src/lib/api.",
    },
  },

  create(context) {
    // Normaliza separadores p/ a checagem funcionar no Windows e no POSIX.
    const filename = getFilename(context).replace(/\\/g, "/");

    function checkSource(node, source: string): void {
      if (ALWAYS_FORBIDDEN.some((pkg) => matchesPackage(source, pkg))) {
        context.report({ node, messageId: "forbidden" });
        return;
      }

      if (matchesPackage(source, "valibot") && !filename.endsWith(".schema.ts")) {
        context.report({ node, messageId: "valibotZone" });
        return;
      }

      if (matchesPackage(source, "ky") && !filename.includes("src/lib/api/")) {
        context.report({ node, messageId: "kyZone" });
      }
    }

    function checkDeclaration(node): void {
      const source = node.source;
      if (typeof source?.value === "string") {
        checkSource(node, source.value);
      }
    }

    return {
      ImportDeclaration: checkDeclaration,
      ExportNamedDeclaration: checkDeclaration,
      ExportAllDeclaration: checkDeclaration,
    };
  },
};

export default noForbiddenImports;
