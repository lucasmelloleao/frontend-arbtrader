/**
 * Rule: boilerplate/api-through-lib
 *
 * Forbids calling `fetch(...)` directly against Boilerplate backend URLs from
 * outside `src/lib/api/`. Callers must use `apiClient` / `ky` from lib/api
 * instead.
 *
 * Dispara quando o TEXTO-FONTE do 1º argumento de `fetch` contém um domínio
 * do backend ("example.com") ou uma env var de API
 * ("NEXT_PUBLIC_API_URL"/"INTERNAL_API_URL"). Cobre string literal, template
 * literal (`https://api.example.com/${x}`) e concatenação.
 *
 * Exempt: any file whose path includes "src/lib/api/".
 */

import { getFilename } from "./_context-utils.ts";

const BACKEND_DOMAINS = ["example.com"];
const API_ENV_VARS = ["NEXT_PUBLIC_API_URL", "INTERNAL_API_URL"];

const MESSAGE = "nao chame o backend com fetch cru; use apiClient/ky de lib/api";

const apiThroughLib = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw fetch() calls to Boilerplate backend URLs; use apiClient/ky from lib/api.",
    },
    messages: {
      useApiClient: MESSAGE,
    },
  },

  create(context) {
    // Normalise path separators so the check works on Windows and POSIX.
    const filename = getFilename(context).replace(/\\/g, "/");

    // Files inside src/lib/api/ are the implementation themselves: skip.
    if (filename.includes("src/lib/api/")) {
      return {};
    }

    const needles = [...BACKEND_DOMAINS, ...API_ENV_VARS];

    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;

        // Only interested in bare `fetch(...)` calls.
        if (callee.type !== "Identifier" || (callee as { name: string }).name !== "fetch") {
          return;
        }

        if (args.length === 0) return;

        // Texto-fonte do 1º arg: cobre literal, template literal e concatenação.
        const src = context.getSourceCode().getText(args[0]);
        if (needles.some((n) => src.includes(n))) {
          context.report({ node, messageId: "useApiClient" });
        }
      },
    };
  },
};

export default apiThroughLib;
